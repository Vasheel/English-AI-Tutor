import React, { useState, useEffect, useCallback } from 'react';
import { chat as chatApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from "./ui/button";
import { Loader2, MessageSquare, Plus, Settings, Trash2, Edit2 } from "lucide-react";
import VoiceControls from './VoiceControls';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useSupabaseProgress } from '@/hooks/useSupabaseProgress';

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

// Question Interceptor (same as before)
const politicalQuestionInterceptor = (userMessage: string): string | null => {
  const lowerMsg = userMessage.toLowerCase();
  
  if ((lowerMsg.includes('prime minister') || lowerMsg.includes('pm')) && lowerMsg.includes('mauritius')) {
    return `The current Prime Minister of Mauritius is Dr Navinchandra Ramgoolam since November 2024.`;
  }
  
  if ((lowerMsg.includes('president') || lowerMsg.includes('head of state')) && lowerMsg.includes('mauritius')) {
    return `Mauritius has a President as Head of State, but Prime Minister Dr Ramgoolam runs the government.`;
  }
  
  if ((lowerMsg.includes('leader') || lowerMsg.includes('government') || lowerMsg.includes('minister')) && lowerMsg.includes('mauritius') && (lowerMsg.includes('who') || lowerMsg.includes('current'))) {
    return `The government of Mauritius is led by Prime Minister Dr Navinchandra Ramgoolam since November 2024.`;
  }
  
  if (lowerMsg.includes('election') && lowerMsg.includes('mauritius') && (lowerMsg.includes('2024') || lowerMsg.includes('recent') || lowerMsg.includes('latest'))) {
    return `The November 2024 Mauritius election was won by Dr Navinchandra Ramgoolam's alliance.`;
  }
  
  return null;
};

const STANDARD_SYSTEM_PROMPT = "You are an English learning assistant for level 6 (PSAC) students in Mauritius. Provide direct, concise answers without excessive examples. Keep all responses to around 20-25 words maximum unless the user specifically requests more detail or asks for a specific word count. When counting words, be extremely accurate - count every word including articles, prepositions, and conjunctions. When asked for word counts, provide the exact number and double-check your count.";

const ChatBot: React.FC<ChatBotProps> = ({ 
  systemPrompt = STANDARD_SYSTEM_PROMPT, 
  model = (import.meta.env.VITE_CHAT_MODEL as string) || "gpt-5" 
}) => {
  const { updateProgress, addSession } = useSupabaseProgress();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [messageCount, setMessageCount] = useState<number>(0);

  const {
    sessions,
    currentSession,
    messages: dbMessages,
    loading,
    createSession,
    switchSession,
    saveMessage,
    updateSessionTitle,
    deleteSession,
    generateSessionTitle
  } = useChatSessions();

  // Convert database messages to display format
  const messages: ChatMessage[] = dbMessages.map(msg => ({
    text: msg.content,
    type: msg.message_type as 'user' | 'bot',
    timestamp: new Date(msg.timestamp).toLocaleTimeString()
  }));

  const trackSessionTime = async (sessionTitle: string) => {
    if (sessionStartTime === 0) return;
    
    try {
      const timeSpentSeconds = Math.max(1, Math.floor((Date.now() - sessionStartTime) / 1000));
      
      // Track only time spent, no scores
      await updateProgress("psac_chat", {
        total_attempts: 1, // Track as 1 session attempt
        correct_answers: 0, // No scores tracked
        total_time_spent: timeSpentSeconds,
        current_streak: 0,
        best_streak: 0
      });

      await addSession({
        user_id: '', // Will be filled by the hook
        activity_type: 'psac_chat',
        score: 0, // No score tracking
        total_questions: messageCount, // Track number of messages exchanged
        time_spent: timeSpentSeconds,
        difficulty_level: 1,
        session_data: {
          psac_chat_data: {
            session_title: sessionTitle,
            time_spent: timeSpentSeconds,
            messages_exchanged: messageCount,
            model_used: model
          }
        }
      });

      console.log('✅ PSAC Chat time tracked:', { sessionTitle, timeSpentSeconds, messageCount });
    } catch (error) {
      console.error('❌ Failed to track PSAC Chat time:', error);
    }
  };

  // Initialize with first session or create new one
  useEffect(() => {
    if (!loading && !currentSession && sessions.length === 0) {
      createSession('New Chat');
    } else if (!loading && !currentSession && sessions.length > 0) {
      switchSession(sessions[0]);
    }
  }, [loading, currentSession, sessions, createSession, switchSession]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !currentSession) return;

    // Start session timer on first message
    if (sessionStartTime === 0) {
      setSessionStartTime(Date.now());
    }

    // Increment message count
    setMessageCount(prev => prev + 1);

    // Save user message to database
    await saveMessage('user', text);

    // Check for political questions first
    const interceptedResponse = politicalQuestionInterceptor(text);
    if (interceptedResponse) {
      await saveMessage('bot', interceptedResponse);
      setInput('');
      return;
    }

    // For non-political questions, call LLM
    setIsLoading(true);
    setError(null);

    try {
      // Build conversation history for API
      const conversationHistory = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      const messagesForAPI = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: text }
      ];

      const data = await chatApi(messagesForAPI, { model, temperature: 0.7, max_tokens: 256 });
      const botResponse = data.reply.trim();

      // Save bot response to database
      await saveMessage('bot', botResponse);

      // Auto-generate session title from first user message
      if (messages.length === 0) {
        const title = generateSessionTitle(text);
        await updateSessionTitle(currentSession.id, title);
      }

    } catch (err) {
      const errorMessage = 'Sorry, I encountered an error. Please try again.';
      setError(errorMessage);
      console.error('Chat error:', err);
      await saveMessage('bot', errorMessage, { error: true });
    } finally {
      setIsLoading(false);
    }

    setInput('');
  }, [systemPrompt, model, currentSession, saveMessage, messages.length, generateSessionTitle, updateSessionTitle]);

  const handleSpeechInput = useCallback((text: string) => {
    sendMessage(text);
  }, [sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleNewChat = async () => {
    // Track time for current session before creating new one
    if (currentSession && sessionStartTime > 0) {
      await trackSessionTime(currentSession.title);
    }
    
    await createSession('New Chat');
    setSessionStartTime(0);
    setMessageCount(0);
  };

  const handleEditTitle = async (sessionId: string, newTitle: string) => {
    await updateSessionTitle(sessionId, newTitle);
    setEditingTitle(null);
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  // Track time when component unmounts
  useEffect(() => {
    return () => {
      if (currentSession && sessionStartTime > 0) {
        trackSessionTime(currentSession.title);
      }
    };
  }, [currentSession, sessionStartTime]);

  // Periodic time tracking every 30 seconds
  useEffect(() => {
    if (sessionStartTime > 0 && currentSession) {
      const interval = setInterval(() => {
        trackSessionTime(currentSession.title);
        // Reset timer to continue tracking
        setSessionStartTime(Date.now());
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [sessionStartTime, currentSession]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen max-h-[800px]">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 bg-gray-50 border-r flex flex-col">
          <div className="p-4 border-b">
            <Button onClick={handleNewChat} className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center justify-between p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                  currentSession?.id === session.id
                    ? 'bg-blue-100 border border-blue-200'
                    : 'bg-white hover:bg-gray-100'
                }`}
                onClick={() => switchSession(session)}
              >
                <div className="flex-1 min-w-0">
                  {editingTitle === session.id ? (
                    <input
                      type="text"
                      defaultValue={session.title}
                      className="w-full text-sm bg-transparent border-none outline-none"
                      onBlur={(e) => handleEditTitle(session.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleEditTitle(session.id, e.currentTarget.value);
                        }
                        if (e.key === 'Escape') {
                          setEditingTitle(null);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <>
                      <p className="text-sm font-medium truncate">{session.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(session.updated_at).toLocaleDateString()}
                      </p>
                    </>
                  )}
                </div>
                
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTitle(session.id);
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this chat session?')) {
                        deleteSession(session.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 rounded-none border-0">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSidebar(!showSidebar)}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-xl">
                    {currentSession?.title || 'PSAC English Chat Tutor'}
                  </CardTitle>
                  <Badge variant="outline">PSAC Mode • Current Facts ✓</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            <div 
              className="flex-1 overflow-y-auto p-4 bg-gray-50" 
              id="chat-container"
            >
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

            <div className="p-4 border-t bg-white">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatBot;