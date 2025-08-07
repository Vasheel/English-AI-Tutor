import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function validateWithChatGPT({
  question,
  userAnswer,
  correctAnswer,
  apiKey
}: {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  apiKey: string;
}): Promise<{ isCorrect: boolean; explanation: string }> {
  const prompt = `You are an English exam tutor. Here is a question from a test:\n\nQuestion: ${question}\n\nCorrect Answer: ${correctAnswer}\nUser's Answer: ${userAnswer}\n\n1. Is the user's answer correct? Reply only with Yes or No.\n2. Give a short explanation for the user, explaining why their answer is correct or not, and what the correct answer means in context.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful English exam tutor.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.2
    })
  });

  if (!response.ok) {
    throw new Error('Failed to contact OpenAI API');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // Parse the response for correctness and explanation
  const isCorrect = /^yes/i.test(content.trim());
  const explanation = content.replace(/^yes\.?|^no\.?/i, '').trim();

  return { isCorrect, explanation };
}
