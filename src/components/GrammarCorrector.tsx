import { useState } from "react";

const GrammarCorrector = () => {
  const [input, setInput] = useState("");
  const [corrected, setCorrected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const correctGrammar = async () => {
    setLoading(true);
    setCorrected("");
    setError("");

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: `Please correct the grammar in the following sentence and explain the correction: "${input}"`,
            },
          ],
          temperature: 0.2,
        }),
      });

      const data = await response.json();

      if (data.choices && data.choices[0]?.message?.content) {
        setCorrected(data.choices[0].message.content);
      } else {
        setError("Could not process response.");
        console.error("OpenAI error:", data);
      }
    } catch (err) {
      console.error("Network error:", err);
      setError("Oops! Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      correctGrammar();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-4xl mx-auto mt-6">
      <h3 className="text-lg font-semibold mb-2">📝 Grammar Helper</h3>
      <p className="text-sm text-gray-500 mb-4">
        Type a sentence and I’ll help you make it perfect! Press Ctrl+Enter to check quickly.
      </p>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="She don't has no pencil..."
        className="w-full h-32 p-3 border border-gray-300 rounded-lg mb-4 resize-none"
      />
      <button
        onClick={correctGrammar}
        className="bg-purple-400 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition"
        disabled={loading}
      >
        {loading ? "Checking..." : "Check My Grammar"}
      </button>

      {corrected && (
        <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-lg whitespace-pre-wrap">
          <strong>✅ Suggestion:</strong>
          <p>{corrected}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default GrammarCorrector;
