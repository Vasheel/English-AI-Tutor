import React, { useState, useEffect, useRef, useCallback } from "react";
import VoiceControls from "@/components/VoiceControls";

const GrammarTutor: React.FC = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong with OpenAI.");
    } finally {
      setLoading(false);
    }
  }, [input, setLoading, setError, setOutput]);

  const grammarCheckRef = useRef<() => Promise<void>>(null);

  useEffect(() => {
    grammarCheckRef.current = handleGrammarCheck;
  }, [handleGrammarCheck]);

  useEffect(() => {
    const handleSpeechInput = (event: CustomEvent) => {
      const { text, type } = event.detail;
      if (type === 'grammar') {
        setInput(text);
        handleGrammarCheck();
      }
    };

    // Listen for speech input events
    window.addEventListener('speech-input', handleSpeechInput);

    return () => {
      window.removeEventListener('speech-input', handleSpeechInput);
    };
  }, [handleGrammarCheck, setInput]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Grammar Correction</h1>

      <div className="mb-4">
        <VoiceControls />
      </div>

      <textarea
        className="w-full border p-3 rounded mb-4"
        rows={4}
        placeholder="Type or speak your sentence here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        onClick={handleGrammarCheck}
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
  );
};

export default GrammarTutor;
