import { useState } from "react";

type MCQItem = {
  type: "mcq";
  question: string;
  options: string[];
  answer: string | number;
  explanation?: string;
};

type FITBItem = {
  type: "fitb";
  question: string;
  answer: string | string[];
  explanation?: string;
};

type QuizItem = MCQItem | FITBItem;

export default function QuizFetcher() {
  const [items, setItems] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);
    setItems([]);

    try {
      const base = (import.meta as any).env?.VITE_API_BASE || "";
      const res = await fetch(`${base}/api/quizzes/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit: 1,
          skills: ["grammar", "vocabulary"],
          count: 3,
          difficulty: "PSAC-G6",
          keywords: ["nouns"],
          query: "Grade 6 English nouns",
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const normalized: QuizItem[] = Array.isArray(data) ? data : data.items ?? [];
      setItems(normalized);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-3">AI Quiz</h1>
      <button
        onClick={fetchQuiz}
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Generating…" : "Generate Quiz"}
      </button>

      {error && <p className="mt-3 text-red-600">Error: {error}</p>}

      <div className="mt-6 space-y-6">
        {items.map((item, idx) => (
          <div key={idx} className="rounded border p-4">
            <p className="font-medium mb-2">{idx + 1}. {item.question}</p>

            {item.type === "mcq" && "options" in item && (
              <ul className="list-disc ml-6 space-y-1">
                {item.options.map((opt, i) => (
                  <li key={i}>{opt}</li>
                ))}
              </ul>
            )}

            {item.type === "fitb" && (
              <input
                className="border rounded px-2 py-1 mt-2 w-full"
                placeholder="Type your answer"
              />
            )}

            {"explanation" in item && item.explanation && (
              <p className="text-sm text-gray-600 mt-3">
                Hint: {item.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


