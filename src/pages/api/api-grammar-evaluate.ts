import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import * as Diff from 'diff';

interface GrammarRequest {
  text: string;
  image_id?: string;
  mode?: 'minimal' | 'fluency';
  dialect?: string;
  grade_level?: number;
}

interface Explanation {
  span: string;
  type: string;
  note: string;
}

// Static metadata for images used for context checking. Each entry includes objects and actions.
const imageMetadata: Record<string, { objects: string[]; actions: string[]; locations: string[] }> = {
  'easy-01': { objects: ['dog', 'ball', 'grass'], actions: ['play', 'run', 'carry'], locations: ['park', 'grass'] },
  'easy-02': { objects: ['child', 'book', 'bench'], actions: ['read', 'sit'], locations: ['park', 'bench'] },
  'easy-03': { objects: ['girl', 'bicycle', 'helmet'], actions: ['ride', 'cycle'], locations: ['road', 'park'] },
  'medium-01': { objects: ['girl', 'dog', 'food'], actions: ['feed', 'give'], locations: ['garden', 'yard'] },
  'medium-02': { objects: ['bus', 'people', 'station'], actions: ['board', 'wait'], locations: ['bus stop', 'station'] },
  'medium-03': { objects: ['children', 'ball', 'field'], actions: ['kick', 'play'], locations: ['field', 'park'] },
  'hard-01': { objects: ['street', 'rain', 'lights'], actions: ['reflect', 'rain'], locations: ['city', 'street'] },
  'hard-02': { objects: ['teacher', 'map', 'students'], actions: ['point', 'raise', 'ask'], locations: ['classroom'] },
  'hard-03': { objects: ['family', 'mountain', 'backpacks'], actions: ['hike', 'walk'], locations: ['mountain', 'trail'] },
};

// Simple synonyms for context matching
const synonyms: Record<string, string[]> = {
  dog: ['dog', 'puppy', 'canine'],
  child: ['child', 'kid', 'boy', 'girl'],
  ball: ['ball', 'football', 'soccer'],
  girl: ['girl', 'young woman'],
  boy: ['boy', 'kid'],
  book: ['book', 'storybook'],
  bicycle: ['bicycle', 'bike', 'cycle'],
  feed: ['feed', 'give'],
  read: ['read', 'reading'],
  ride: ['ride', 'cycle', 'bike'],
  play: ['play', 'playing'],
  hike: ['hike', 'walk', 'trek'],
};

// Simple function to generate a diff between original and corrected text
function generateDiff(original: string, corrected: string) {
  return Diff.diffWords(original, corrected);
}

// Naive scoring: 100 minus 10 per change (major) and 5 per minor
function scoreChanges(changes: Diff.Change[]) {
  let score = 100;
  for (const change of changes) {
    if (change.added || change.removed) {
      score -= 10;
    }
  }
  return Math.max(0, score);
}

// Compute context score based on whether the student's sentence mentions at least one object and one action from the image metadata
function evaluateContext(text: string, imageId?: string) {
  // If no image or unknown id, context passes with full score and no missing hints
  if (!imageId || !(imageId in imageMetadata)) {
    return { contextScore: 100, passed: true, missing: [] };
  }
  const meta = imageMetadata[imageId];
  // Extract level from image id (e.g., 'easy-01' => 'easy')
  const level = imageId.split('-')[0] as 'easy' | 'medium' | 'hard';
  // Define how many objects must be suggested based on difficulty
  const requiredObjects: Record<'easy' | 'medium' | 'hard', number> = {
    easy: 1,
    medium: 2,
    hard: 3,
  };
  // Tokenize the sentence: lowercase, remove punctuation, split by spaces
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  // Helper to check if any of the tokens match targets using synonyms
  const tokenMatches = (target: string[]) => {
    return tokens.some((tok) => {
      // Direct match
      if (target.includes(tok)) return true;
      // Check synonyms mapping for token (forward)
      if (synonyms[tok]) {
        return synonyms[tok].some((syn) => target.includes(syn));
      }
      // Check reverse: if target's synonyms include token
      return target.some((t) => synonyms[t]?.includes(tok));
    });
  };
  const objectMatched = tokenMatches(meta.objects);
  const actionMatched = tokenMatches(meta.actions);
  // Determine which objects are missing (not mentioned)
  const missingObjects: string[] = meta.objects.filter((obj) => {
    // Consider synonyms; if any synonym matches, it's considered mentioned
    return !tokens.some((tok) => {
      if (obj === tok) return true;
      // token synonyms match
      if (synonyms[tok] && synonyms[tok].includes(obj)) return true;
      // reverse synonyms
      if (synonyms[obj] && synonyms[obj].includes(tok)) return true;
      return false;
    });
  });
  // Provide a hint list based on level: at least one object, up to the required number
  const hintCount = requiredObjects[level];
  const missing: string[] = missingObjects.slice(0, hintCount);
  // Score: full score if both an object and an action matched; half if only one matched; else 0
  let contextScore = 0;
  if (objectMatched && actionMatched) contextScore = 100;
  else if (objectMatched || actionMatched) contextScore = 50;
  else contextScore = 0;
  const passed = contextScore >= 60;
  return { contextScore, passed, missing };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const { text, mode = 'minimal', dialect = 'en-US', grade_level = 6 } = req.body as GrammarRequest;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Invalid text' });
  }
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // Build a prompt to correct grammar and explain changes
    const prompt = `You are an English grammar tutor for grade ${grade_level} students. Correct the following sentence. Provide your correction only, with no explanation.\n\nSentence: "${text}"`;
    const chatRes = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that corrects grammar and spelling.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
    });
    const corrected = chatRes.choices?.[0]?.message?.content?.trim() || text;
    const diff = generateDiff(text, corrected);
    const grammarScore = scoreChanges(diff);
    // Evaluate context based on image id
    const { contextScore, passed, missing } = evaluateContext(text, req.body.image_id);
    // Combine grammar and context scores (70% grammar, 30% context)
    const finalScore = Math.round(grammarScore * 0.7 + contextScore * 0.3);
    // Tags placeholder: in a real implementation, this would be more detailed
    const tags = { SVA: 0, Article: 0, Spelling: 0, Punctuation: 0, Tense: 0, WordChoice: 0 };
    const explanations: Explanation[] = [];
    return res.status(200).json({
      corrected,
      diff,
      grammarScore,
      contextScore,
      finalScore,
      tags,
      context: { passed, missing },
      explanations,
      confidence: 'medium',
    });
  } catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to process grammar evaluation' });
  }
}