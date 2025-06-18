import React, { useState, useEffect, useCallback } from 'react';
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

const ChatBot: React.FC<ChatBotProps> = ({ systemPrompt = "You are an English learning assistant. You help users improve their English skills by answering questions, correcting grammar, and providing explanations.", model = "gpt-3.5-turbo" }) => {
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
      // Prepare messages for OpenAI
      const messagesForAPI = [
        { role: 'system', content: systemPrompt },
        ...context.map(msg => ({ role: 'user', content: msg })),
        { role: 'user', content: text }
      ];

      // Make API call
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model,
          messages: messagesForAPI,
          temperature: 0.7,
          max_tokens: 256
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      const botResponse = data.choices[0].message.content.trim();

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
      <div className="h-[600px] border rounded-lg overflow-y-auto p-4 bg-gray-50" id="chat-container">
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
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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

      <VoiceControls onSpeechInput={handleSpeechInput} />
    </div>
  );
};

export default ChatBot;
