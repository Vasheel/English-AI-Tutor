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

const ChatBot: React.FC<ChatBotProps> = ({ systemPrompt = "You are a PSAC (Primary School Achievement Certificate) Grade 6 English tutor for Mauritius. Always answer within the PSAC syllabus and exam style: clear explanations, age-appropriate vocabulary, short steps, and 1–2 PSAC-style examples. When users ask general questions, relate the answer to PSAC topics (grammar, vocabulary, comprehension, writing). If off‑syllabus, briefly redirect and connect to a relevant PSAC concept.", model = (import.meta.env.VITE_CHAT_MODEL as string) || "gpt-5" }) => {
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
    setContext(prev => [...prev, text]);

    // Start loading
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
            <Badge variant="outline">PSAC Mode</Badge>
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
              className={`inline-block p-4 rounded-xl ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.error ? 'bg-red-500 text-white' : 'bg-gray-100'
              }`}
            >
              <p className="mb-1">{message.text}</p>
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
