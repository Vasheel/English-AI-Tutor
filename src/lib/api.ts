// client/src/lib/api.ts
// Thin wrappers over your FastAPI endpoints.
// If you use Supabase Auth on the frontend, you can pass the user's JWT to the backend.
// Your backend can then read Authorization: Bearer <token> if you want to link attempts to auth.uid().

const API = import.meta.env.VITE_API_BASE ?? ""; // Use proxy in dev, env var in prod

type GenerateQuizPayload = {
    // Legacy shape support
    topic?: string;
    grade?: string;
    num_questions?: number;
    
    // New shape
    unit?: number | null;
    skills?: string[];
    count?: number;
    difficulty?: string;
    keywords?: string[];
    query?: string | null;
    seed?: number;
  };
  
  type AttemptPayload = {
    quiz_id: string;
    item_id: string;
    skill: string;
    user_id?: string | null;   // optional; you can omit if backend derives from JWT
    user_answer: string;
    is_correct: boolean;
    time_ms?: number;
  };

  // Shape of the backend quiz response consumed by the UI adapter
  export type BackendQuizResponse = {
    items?: Array<{
      id?: string;
      type: 'mcq' | 'fitb' | 'reorder' | 'match' | 'short';
      question?: string;
      options?: string[];
      answer: string | number | string[];
      explanation?: string;
    }>;
    source?: string;
  };
  
  // OPTIONAL: forward Supabase Auth token (if you use it).
  // Call withAuthHeaders() and pass headers into fetch below if you need auth context on backend.
  export async function withAuthHeaders(): Promise<Record<string, string>> {
    try {
      // Lazy-import to avoid bundling if you don't use Supabase Auth here
      const { createClient } = await import('@supabase/supabase-js');
      // Expect these envs in your Vite app (set in .env or .env.local)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
      const { data } = await supabase.auth.getSession();
      const jwt = data.session?.access_token;
      return jwt ? { Authorization: `Bearer ${jwt}` } : {};
    } catch {
      return {};
    }
  }
  
  // Fixed generateQuiz function in api.ts - replace the existing function

export async function generateQuiz(payload: GenerateQuizPayload = { topic: "tenses", grade: "Grade 6", num_questions: 6 }) {
  const headers = { "Content-Type": "application/json", ...(await withAuthHeaders()) };

  // Increased timeout for AI generation - it can take longer
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s instead of 20s

  try {
    const url = `${API}/api/quizzes/generate`;
    console.log("[quiz] calling:", url);
    console.log("[quiz] payload:", payload);
    
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store"
    });
    
    console.log("[quiz] response status:", res.status);
    console.log("[quiz] response ok:", res.ok);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[quiz] error response:", errorText);
      throw new Error(errorText || "Quiz generation failed");
    }
    
    const data = await res.json();
    console.log("[quiz] success response:", data);
    return data;
    
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error("[quiz] request timed out after 60s");
      throw new Error("Request timed out after 60 seconds. The AI is taking longer than usual.");
    }
    console.error("[quiz] request failed:", err);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
  
  
  export async function saveQuiz(quiz: Record<string, unknown>) {
    const headers = { 'Content-Type': 'application/json', ...(await withAuthHeaders()) };
    const res = await fetch(`${API}/api/quizzes/save`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ quiz }),
      cache: "no-store"
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<{ id: string }>;
  }
  
  export async function logAttempt(payload: AttemptPayload) {
    const headers = { 'Content-Type': 'application/json', ...(await withAuthHeaders()) };
    const res = await fetch(`${API}/api/attempts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      cache: "no-store"
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
  
  export async function getNextDifficulty(user_id: string, skill: string) {
    const headers = { 'Content-Type': 'application/json', ...(await withAuthHeaders()) };
    const res = await fetch(`${API}/api/next-difficulty`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id, skill }),
      cache: "no-store"
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<{ skill: string }>;
  }