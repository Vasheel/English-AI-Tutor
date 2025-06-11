
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sentence } = await req.json();

    if (!sentence) {
      return new Response(
        JSON.stringify({ error: 'Sentence is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are a friendly English tutor for 6th grade students. A student has written this sentence: "${sentence}"

Please respond with a JSON object containing:
- "originalSentence": the exact sentence the student wrote
- "correctedSentence": the grammatically correct version (only if there are errors)
- "hasErrors": true if there are grammar errors, false if the sentence is already correct
- "explanation": a simple, encouraging explanation suitable for a 6th grader

For the explanation:
- If there are NO errors: Explain what makes the sentence good (proper grammar rules used)
- If there ARE errors: Explain the mistakes in simple terms and why the correction helps
- Use encouraging language and simple vocabulary
- Keep it under 100 words
- Focus on learning, not criticism

Example format:
{
  "originalSentence": "Me and my friend goes to school everyday.",
  "correctedSentence": "My friend and I go to school every day.",
  "hasErrors": true,
  "explanation": "Great job writing! I made two small changes: 1) We say 'My friend and I' instead of 'Me and my friend' when we're the ones doing something. 2) 'Every day' is two words when we mean 'each day', and 'go' matches with 'My friend and I'. Keep practicing - you're doing well!"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful, encouraging English tutor for 6th grade students. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Parse the JSON response from AI
    let correctionResult;
    try {
      correctionResult = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Invalid response format from AI');
    }

    return new Response(JSON.stringify(correctionResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in correct-grammar function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to correct grammar',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
