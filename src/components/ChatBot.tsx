import React, { useState, useEffect, useCallback } from 'react';
import { chat as chatApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import VoiceControls from './VoiceControls';
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

interface ChatMessage {
  text: string;
  type: 'user' | 'bot';
  timestamp: string;
  error?: string;
}

interface ChatBotProps {
  systemPrompt?: string;
  model?: string;
}

// Question Interceptor for Political/Current Affairs Questions
const politicalQuestionInterceptor = (userMessage: string): string | null => {
  const lowerMsg = userMessage.toLowerCase();
  
  // Prime Minister questions
  if ((lowerMsg.includes('prime minister') || lowerMsg.includes('pm')) && lowerMsg.includes('mauritius')) {
    return `The current Prime Minister of Mauritius is **Dr Navinchandra Ramgoolam**. He won the election in November 2024, becoming Prime Minister for the fourth time in his career.`;
  }
  
  // President questions
  if ((lowerMsg.includes('president') || lowerMsg.includes('head of state')) && lowerMsg.includes('mauritius')) {
    return `Mauritius has a President as Head of State, but the Prime Minister (Dr Navinchandra Ramgoolam) is the Head of Government who runs the country.

**PSAC Learning:** This is a good example of the difference between:
- **Head of State** = President (ceremonial role)
- **Head of Government** = Prime Minister (runs the government)

**Writing Practice:** "Mauritius has both a President and a Prime Minister. The Prime Minister has more power in running the country."

For current President information, check recent official sources as this information can change.`;
  }
  
  // Government/Leader questions
  if ((lowerMsg.includes('leader') || lowerMsg.includes('government') || lowerMsg.includes('minister')) && lowerMsg.includes('mauritius') && (lowerMsg.includes('who') || lowerMsg.includes('current'))) {
    return `The government of Mauritius is led by Prime Minister **Dr Navinchandra Ramgoolam** (since November 2024).

**PSAC Grammar Focus - Question Words:**
- **Who** = asking about people ("Who is the Prime Minister?")
- **What** = asking about things ("What is the capital?")
- **When** = asking about time ("When was he elected?")
- **Where** = asking about places ("Where is the government located?")

**Example sentences:**
- "Who leads Mauritius?" → "Dr Ramgoolam leads Mauritius."
- "When did he become PM?" → "He became PM in November 2024."

Always verify current political information with recent news sources!`;
  }
  
  // Election questions
  if (lowerMsg.includes('election') && lowerMsg.includes('mauritius') && (lowerMsg.includes('2024') || lowerMsg.includes('recent') || lowerMsg.includes('latest'))) {
    return `The most recent Mauritius general election was held in **November 2024**. Dr Navinchandra Ramgoolam's alliance won, and he became Prime Minister for the fourth time.

**PSAC Writing Skills - Describing Events:**
- Past tense for completed events: "The election was held in November."
- Present perfect for recent events: "Dr Ramgoolam has become Prime Minister."
- Sequence words: "First, the election took place. Then, the results were announced. Finally, the new PM was sworn in."

**Vocabulary building:**
- Election = when people vote for leaders
- Alliance = groups working together
- Term = period of time in office

Remember to check current news for the most up-to-date election information!`;
  }
  
  return null; // No interception needed
};

// Standard system prompt for non-intercepted questions
const STANDARD_SYSTEM_PROMPT = "You are an English learning assistant for students in Mauritius. Provide direct, concise answers without excessive examples.";

const ChatBot: React.FC<ChatBotProps> = ({ 
  systemPrompt = STANDARD_SYSTEM_PROMPT, 
  model = (import.meta.env.VITE_CHAT_MODEL as string) || "gpt-5" 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<string[]>([]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      text,
      type: 'user',
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // CHECK FOR POLITICAL QUESTIONS FIRST - INTERCEPT BEFORE LLM
    const interceptedResponse = politicalQuestionInterceptor(text);
    if (interceptedResponse) {
      // Provide immediate, accurate response without consulting LLM
      setMessages(prev => [...prev, {
        text: interceptedResponse,
        type: 'bot',
        timestamp: new Date().toLocaleTimeString()
      }]);
      return; // Exit early, don't call the LLM
    }

    // For non-political questions, proceed with normal LLM chat
    setContext(prev => [...prev, text]);
    setIsLoading(true);
    setError(null);

    try {
      // Prepare messages for backend chat
      const messagesForAPI = [
        { role: 'system', content: systemPrompt },
        ...context.map(msg => ({ role: 'user', content: msg })),
        { role: 'user', content: text }
      ];

      // Make API call to backend (proxy to OpenAI)
      const data = await chatApi(messagesForAPI, { model, temperature: 0.7, max_tokens: 256 });
      const botResponse = data.reply.trim();

      // Add bot message
      setMessages(prev => [...prev, {
        text: botResponse,
        type: 'bot',
        timestamp: new Date().toLocaleTimeString()
      }]);

    } catch (err) {
      setError('Sorry, I encountered an error. Please try again.');
      console.error('Chat error:', err);
      
      // Add error message
      setMessages(prev => [...prev, {
        text: 'Sorry, I encountered an error. Please try again.',
        type: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        error: 'error'
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [systemPrompt, model, context]);

  // Handle speech input from VoiceControls
  const handleSpeechInput = useCallback((text: string) => {
    sendMessage(text);
  }, [sendMessage]);

  // Handle text input submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  // Clear context if too many messages
  useEffect(() => {
    if (context.length > 5) {
      setContext(prev => prev.slice(1));
    }
  }, [context]);

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">PSAC English Chat Tutor</CardTitle>
            <Badge variant="outline">PSAC Mode • Current Facts ✓</Badge>
          </div>
        </CardHeader>
        <CardContent>
      <div className="h-[520px] border rounded-lg overflow-y-auto p-4 bg-gray-50" id="chat-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${
              message.type === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-4 rounded-xl max-w-[85%] ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.error ? 'bg-red-500 text-white' : 'bg-gray-100'
              }`}
            >
              <div className="whitespace-pre-wrap mb-1">{message.text}</div>
              <small className="block text-gray-500 text-xs">
                {message.timestamp}
              </small>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-center mt-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto" />
            <p className="text-gray-500 mt-2">Thinking...</p>
          </div>
        )}
        {error && (
          <div className="text-red-500 text-sm mb-4">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a PSAC-style question (grammar, vocabulary, comprehension, writing)..."
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Sending...
            </>
          ) : 'Send'}
        </Button>
      </form>

      <div className="mt-3">
        <VoiceControls onSpeechInput={handleSpeechInput} />
      </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatBot;