// client/src/lib/api.ts
// Thin wrappers over your FastAPI endpoints.
// If you use Supabase Auth on the frontend, you can pass the user's JWT to the backend.
// Your backend can then read Authorization: Bearer <token> if you want to link attempts to auth.uid().

type GenerateQuizPayload = {
    unit?: number | null;
    skills: string[];
    count?: number;
    difficulty?: string;
    keywords?: string[];
    query?: string | null;
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
  
  export async function generateQuiz(payload: GenerateQuizPayload) {
    // If VITE_API_BASE is set, use it; otherwise rely on Vite proxy with a relative path.
    const rawBase = import.meta.env.VITE_API_BASE;
    const API_BASE = rawBase ? rawBase.replace(/\/+$/, "") : ""; // strip trailing '/'
  
    const headers = { "Content-Type": "application/json", ...(await withAuthHeaders()) };
  
    // Optional: timeout so UI doesn't hang forever
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s
  
    try {
      const res = await fetch(`${API_BASE}/api/quizzes/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error((await res.text()) || "Quiz generation failed");
      return await res.json();
    } catch (err: unknown) {
      // Surface useful error (timeout/abort or network)
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("Request timed out. Please try again.");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
  
  
  export async function saveQuiz(quiz: Record<string, unknown>) {
    const API_BASE: string = import.meta.env.VITE_API_BASE ?? '';
    const headers = { 'Content-Type': 'application/json', ...(await withAuthHeaders()) };
    const res = await fetch(`${API_BASE}/api/quizzes/save`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ quiz }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<{ id: string }>;
  }
  
  export async function logAttempt(payload: AttemptPayload) {
    const API_BASE: string = import.meta.env.VITE_API_BASE ?? '';
    const headers = { 'Content-Type': 'application/json', ...(await withAuthHeaders()) };
    const res = await fetch(`${API_BASE}/api/attempts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
  
  export async function getNextDifficulty(user_id: string, skill: string) {
    const API_BASE: string = import.meta.env.VITE_API_BASE ?? '';
    const headers = { 'Content-Type': 'application/json', ...(await withAuthHeaders()) };
    const res = await fetch(`${API_BASE}/api/next-difficulty`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id, skill }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<{ skill: string }>;
  }