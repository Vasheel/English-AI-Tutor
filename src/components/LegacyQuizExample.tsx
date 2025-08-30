import React, { useEffect, useState } from "react";
import { generateQuiz, BackendQuizResponse } from "../lib/api";

export default function LegacyQuizExample() {
  const [data, setData] = useState<BackendQuizResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuiz = async () => {
      setLoading(true);
      setError(null);
      try {
        // Legacy shape works now
        const result = await generateQuiz({ 
          topic: "tenses", 
          grade: "Grade 6", 
          num_questions: 6 
        });
        setData(result);
      } catch (err) {
        console.error('Failed to generate quiz:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, []);

  if (loading) {
    return <div>Loading quiz...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Legacy Quiz Example</h2>
      <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
