// src/services/aiWordService.ts
import { supabase } from "@/integrations/supabase/client";

interface WordCache {
  [key: string]: {
    words: WordData[];
    lastUpdated: number;
  };
}

interface WordData {
  word: string;
  hint: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  synonyms?: string[];
  antonyms?: string[];
  definition?: string;
  example?: string;
  partOfSpeech?: string;
  phonetics?: string;
}

interface RawWordData {
  word?: string;
  hint?: string;
  category?: string;
  difficulty?: string;
  synonyms?: string[];
  antonyms?: string[];
  definition?: string;
  example?: string;
  partOfSpeech?: string;
  phonetics?: string;
}

interface DatabaseWordRecord {
  id: string;
  word: string;
  hint: string;
  category: string;
  difficulty: string;
  synonyms: string[];
  antonyms: string[];
  definition: string;
  example: string;
  part_of_speech: string;
  phonetics: string;
  created_at: string;
}

interface GenerationOptions {
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  theme?: string;
  excludeWords?: string[];
  count?: number;
}

class AIWordService {
  private cache: WordCache = {};
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour
  private readonly MAX_RETRIES = 3;
  private readonly API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

  // Categories for educational focus
  private readonly CATEGORIES = [
    'animals', 'nature', 'science', 'technology', 'food',
    'sports', 'music', 'art', 'geography', 'history',
    'emotions', 'daily life', 'school', 'family', 'weather'
  ];

  // Difficulty configurations
  private readonly DIFFICULTY_CONFIG = {
    easy: {
      wordLength: { min: 4, max: 6 },
      commonWords: true,
      complexityLevel: 'basic',
      gradeLevel: '4-5'
    },
    medium: {
      wordLength: { min: 6, max: 8 },
      commonWords: false,
      complexityLevel: 'intermediate',
      gradeLevel: '5-6'
    },
    hard: {
      wordLength: { min: 8, max: 12 },
      commonWords: false,
      complexityLevel: 'advanced',
      gradeLevel: '6-7'
    }
  };

  /**
   * Generate AI words with caching and retry logic
   */
  async generateWords(options: GenerationOptions): Promise<WordData[]> {
    const cacheKey = this.getCacheKey(options);
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.getFromCache(cacheKey, options.count || 1);
    }

    // Generate new words
    let attempts = 0;
    let words: WordData[] = [];

    while (attempts < this.MAX_RETRIES && words.length < (options.count || 1)) {
      try {
        const newWords = await this.callOpenAI(options);
        words = [...words, ...newWords];
        attempts++;
      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed:`, error);
        attempts++;
        if (attempts >= this.MAX_RETRIES) {
          // Fallback to database cache
          words = await this.getFromDatabase(options);
        }
      }
    }

    // Update cache
    this.updateCache(cacheKey, words);
    
    // Store in database for future fallback
    await this.storeInDatabase(words);

    return words.slice(0, options.count || 1);
  }

  /**
   * Call OpenAI API to generate words
   */
  private async callOpenAI(options: GenerationOptions): Promise<WordData[]> {
    if (!this.API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    const config = this.DIFFICULTY_CONFIG[options.difficulty];
    const category = options.category || this.getRandomCategory();
    const count = options.count || 1;

    const systemPrompt = `You are an educational content generator for 6th grade English learning games. 
    Generate word scramble content that is age-appropriate, educational, and engaging.
    Focus on vocabulary that helps students expand their language skills.`;

    const userPrompt = `Generate ${count} English word(s) with the following requirements:
    - Difficulty: ${options.difficulty} (Grade level: ${config.gradeLevel})
    - Word length: ${config.wordLength.min}-${config.wordLength.max} letters
    - Category: ${category}
    ${options.theme ? `- Theme: ${options.theme}` : ''}
    ${options.excludeWords ? `- Exclude these words: ${options.excludeWords.join(', ')}` : ''}
    
    For each word, provide a JSON array with objects containing:
    - word: the word (uppercase)
    - hint: a helpful clue that doesn't give away the answer
    - category: the word category
    - difficulty: "${options.difficulty}"
    - synonyms: array of 2-3 synonyms
    - antonyms: array of 1-2 antonyms (if applicable)
    - definition: clear, simple definition for 6th graders
    - example: example sentence using the word
    - partOfSpeech: noun/verb/adjective/adverb
    - phonetics: pronunciation guide
    
    Make sure words are appropriate for educational settings and avoid any controversial topics.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 500 * count,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    
    // Ensure we have an array
    const words = Array.isArray(content) ? content : [content];
    
    return words.map(this.validateAndCleanWord);
  }

  /**
   * Validate and clean word data
   */
  private validateAndCleanWord(word: RawWordData): WordData {
    return {
      word: (word.word || '').toUpperCase().trim(),
      hint: word.hint || 'A mystery word',
      category: word.category || 'general',
      difficulty: (word.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
      synonyms: Array.isArray(word.synonyms) ? word.synonyms : [],
      antonyms: Array.isArray(word.antonyms) ? word.antonyms : [],
      definition: word.definition || '',
      example: word.example || '',
      partOfSpeech: word.partOfSpeech || 'noun',
      phonetics: word.phonetics || ''
    };
  }

  /**
   * Get fallback words from database
   */
  private async getFromDatabase(options: GenerationOptions): Promise<WordData[]> {
    try {
      // Use type assertion to handle missing table in Supabase types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('ai_word_cache')
        .select('*')
        .eq('difficulty', options.difficulty)
        .eq('category', options.category || 'general')
        .limit(options.count || 1);

      if (error) throw error;

      return (data as DatabaseWordRecord[])?.map(item => ({
        word: item.word,
        hint: item.hint,
        category: item.category,
        difficulty: item.difficulty as 'easy' | 'medium' | 'hard',
        synonyms: item.synonyms || [],
        antonyms: item.antonyms || [],
        definition: item.definition,
        example: item.example,
        partOfSpeech: item.part_of_speech,
        phonetics: item.phonetics
      })) || this.getStaticFallback(options);
    } catch (error) {
      console.error('Database fetch failed:', error);
      return this.getStaticFallback(options);
    }
  }

  /**
   * Store words in database for caching
   */
  private async storeInDatabase(words: WordData[]): Promise<void> {
    try {
      const records = words.map(word => ({
        word: word.word,
        hint: word.hint,
        category: word.category,
        difficulty: word.difficulty,
        synonyms: word.synonyms,
        antonyms: word.antonyms,
        definition: word.definition,
        example: word.example,
        part_of_speech: word.partOfSpeech,
        phonetics: word.phonetics,
        created_at: new Date().toISOString()
      }));

      // Use type assertion to handle missing table in Supabase types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('ai_word_cache')
        .upsert(records, { onConflict: 'word' });
    } catch (error) {
      console.error('Failed to store words in database:', error);
    }
  }

  /**
   * Get static fallback words
   */
  private getStaticFallback(options: GenerationOptions): WordData[] {
    const fallbacks = {
      easy: [
        {
          word: "HAPPY",
          hint: "Feeling of joy",
          category: "emotions",
          difficulty: "easy" as const,
          definition: "Feeling or showing pleasure",
          example: "She was happy to see her friends.",
          partOfSpeech: "adjective",
          synonyms: ["joyful", "cheerful"],
          antonyms: ["sad", "unhappy"],
          phonetics: "/ˈhæpi/"
        },
        {
          word: "WATER",
          hint: "Essential liquid for life",
          category: "nature",
          difficulty: "easy" as const,
          definition: "Clear liquid that forms seas, lakes, and rivers",
          example: "I drink water every day.",
          partOfSpeech: "noun",
          synonyms: ["H2O", "liquid"],
          antonyms: [],
          phonetics: "/ˈwɔːtər/"
        }
      ],
      medium: [
        {
          word: "JOURNEY",
          hint: "A long trip",
          category: "travel",
          difficulty: "medium" as const,
          definition: "Act of traveling from one place to another",
          example: "Their journey took three days.",
          partOfSpeech: "noun",
          synonyms: ["trip", "voyage", "travel"],
          antonyms: ["stay", "rest"],
          phonetics: "/ˈdʒɜːrni/"
        },
        {
          word: "EXCITED",
          hint: "Very enthusiastic",
          category: "emotions",
          difficulty: "medium" as const,
          definition: "Very enthusiastic and eager",
          example: "The students were excited about the field trip.",
          partOfSpeech: "adjective",
          synonyms: ["thrilled", "eager"],
          antonyms: ["calm", "bored"],
          phonetics: "/ɪkˈsaɪtɪd/"
        }
      ],
      hard: [
        {
          word: "MYSTERIOUS",
          hint: "Hard to understand or explain",
          category: "adjectives",
          difficulty: "hard" as const,
          definition: "Difficult or impossible to understand",
          example: "The old house had a mysterious atmosphere.",
          partOfSpeech: "adjective",
          synonyms: ["enigmatic", "puzzling"],
          antonyms: ["clear", "obvious"],
          phonetics: "/mɪˈstɪəriəs/"
        },
        {
          word: "ADVENTURE",
          hint: "An exciting experience",
          category: "experiences",
          difficulty: "hard" as const,
          definition: "An unusual and exciting experience",
          example: "Reading the book was quite an adventure.",
          partOfSpeech: "noun",
          synonyms: ["quest", "expedition"],
          antonyms: ["routine", "mundane"],
          phonetics: "/ədˈventʃər/"
        }
      ]
    };

    const words = fallbacks[options.difficulty];
    return words.slice(0, options.count || 1);
  }

  /**
   * Cache management methods
   */
  private getCacheKey(options: GenerationOptions): string {
    return `${options.difficulty}_${options.category || 'mixed'}_${options.theme || 'general'}`;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache[key];
    if (!cached) return false;
    return Date.now() - cached.lastUpdated < this.CACHE_DURATION;
  }

  private getFromCache(key: string, count: number): WordData[] {
    const cached = this.cache[key];
    if (!cached) return [];
    
    // Shuffle and return requested count
    const shuffled = [...cached.words].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private updateCache(key: string, words: WordData[]): void {
    this.cache[key] = {
      words,
      lastUpdated: Date.now()
    };
  }

  private getRandomCategory(): string {
    return this.CATEGORIES[Math.floor(Math.random() * this.CATEGORIES.length)];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = {};
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; categories: string[] } {
    return {
      size: Object.keys(this.cache).length,
      categories: Object.keys(this.cache)
    };
  }
}

// Export singleton instance
export const aiWordService = new AIWordService();

// Export types
export type { WordData, GenerationOptions };