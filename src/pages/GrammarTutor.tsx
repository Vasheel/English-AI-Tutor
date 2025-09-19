import React, { useState, useEffect, useRef, useCallback } from "react";
import VoiceControls from "@/components/VoiceControls";
import { useSupabaseProgress } from "@/hooks/useSupabaseProgress";

const GrammarTutor: React.FC = () => {
  const { updateProgress, addSession } = useSupabaseProgress();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const grammarCheckRef = useRef<() => Promise<void>>(null);

  const handleGrammarCheck = useCallback(async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError("");
    setOutput("");

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a grammar tutor for Grade 6 students. Correct their sentence and explain the correction clearly in simple language.",
            },
            {
              role: "user",
              content: input,
            },
          ],
          temperature: 0.7,
          max_tokens: 256,
        }),
      });

      const data = await response.json();
      console.log("OpenAI response:", data);

      const reply = data?.choices?.[0]?.message?.content ?? null;

      if (!reply) {
        setError("No response from OpenAI.");
      } else {
        setOutput(reply);
        
        // Track progress for grammar tutor
        try {
          const timeSpentSeconds = Math.max(1, Math.floor((Date.now() - sessionStartTime) / 1000));
          
          await updateProgress("grammar_tutor", {
            total_attempts: 1,
            correct_answers: 1, // Assume grammar check is helpful
            total_time_spent: timeSpentSeconds,
            current_streak: 1,
            best_streak: 1
          });

          await addSession({
            user_id: '', // Will be filled by the hook
            activity_type: 'grammar_tutor',
            score: 1,
            total_questions: 1,
            time_spent: timeSpentSeconds,
            difficulty_level: 1,
            session_data: {
              grammar_tutor_data: {
                input_text: input,
                output_text: reply,
                time_spent: timeSpentSeconds
              }
            }
          });

          console.log('✅ Grammar Tutor progress saved:', { timeSpentSeconds });
        } catch (error) {
          console.error('❌ Failed to save Grammar Tutor progress:', error);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong with OpenAI.");
    } finally {
      setLoading(false);
    }
  }, [input, setLoading, setError, setOutput]);

  useEffect(() => {
    grammarCheckRef.current = handleGrammarCheck;
  }, [handleGrammarCheck]);

  // Start session timer when component mounts
  useEffect(() => {
    setSessionStartTime(Date.now());
  }, []);

  const handleSpeechInput = useCallback((speech: string) => {
    setInput(speech);
    // Start session timer when user starts using the component
    if (sessionStartTime === 0) {
      setSessionStartTime(Date.now());
    }
  }, [sessionStartTime]);

  useEffect(() => {
    if (output) {
      const utterance = new SpeechSynthesisUtterance();
      utterance.text = `Here's the corrected version: ${output}`;
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  }, [output]);

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8">Grammar Tutor</h1>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Enter or speak a sentence to check:
          </label>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-4">
              <VoiceControls onSpeechInput={handleSpeechInput} isGrammarSection={true} />
              <button
                onClick={() => handleGrammarCheck()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={loading || !input.trim()}
              >
                {loading ? "Checking..." : "Check Grammar"}
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Type or speak a sentence..."
            />
          </div>
        </div>

        <button
          onClick={() => grammarCheckRef.current?.()}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Checking..." : "Check Grammar"}
        </button>

        {output && (
          <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded">
            <strong>AI Tutor:</strong>
            <p>{output}</p>
          </div>
        )}

        {error && <p className="text-red-600 mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default GrammarTutor;
