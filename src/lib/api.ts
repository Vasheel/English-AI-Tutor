// client/src/lib/api.ts
// Thin wrappers over your FastAPI endpoints.
// If you use Supabase Auth on the frontend, you can pass the user's JWT to the backend.
// Your backend can then read Authorization: Bearer <token> if you want to link attempts to auth.uid().

const API = import.meta.env.VITE_API_BASE ?? ""; // Use proxy in dev, env var in prod

type GenerateQuizPayload = {
  topic?: string;
  grade?: string;
  num_questions?: number;
  skills?: string[];
  count?: number;
  difficulty?: string;
  keywords?: string[];
  query?: string;
  seed?: number;
  unit?: string | number | null;  // Changed to accept both string and number
  timestamp?: number;
  session_id?: string;
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

// src/lib/api.ts - Update your generateQuiz function

export async function generateQuiz(payload: GenerateQuizPayload = { 
  topic: "tenses", 
  grade: "Grade 6", 
  num_questions: 6 
}) {
  const headers = { 
    "Content-Type": "application/json",
    // Prevent browser caching
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    ...(await withAuthHeaders()) 
  };

  // Add timestamp and session ID to ensure uniqueness
  const enhancedPayload = {
    ...payload,
    // Add timestamp to make each request unique
    timestamp: Date.now(),
    // Add a random session ID for this quiz
    session_id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    // Add a random seed if not provided
    seed: payload.seed || Math.floor(Math.random() * 1000000)
  };

  // Increased timeout for AI generation
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000); // 180s timeout

  try {
    const url = `${API}/api/quizzes/generate`;
    console.log("[quiz] calling:", url);
    console.log("[quiz] enhanced payload:", enhancedPayload);
    
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(enhancedPayload),
      signal: controller.signal,
      // Critical: Prevent browser from caching this request
      cache: "no-store",
      // Ensure fresh request
      mode: "cors",
      credentials: "same-origin"
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
    
    // Verify we got unique questions
    if (data.items && data.items.length > 0) {
      const firstQuestion = data.items[0].question;
      console.log("[quiz] First question preview:", firstQuestion.substring(0, 50) + "...");
      
      // Store last question to detect repetition (optional debugging)
      if (window.localStorage) {
        const lastQuestion = window.localStorage.getItem('last_quiz_question');
        if (lastQuestion === firstQuestion) {
          console.warn("[quiz] WARNING: Same first question as last time!");
        }
        window.localStorage.setItem('last_quiz_question', firstQuestion);
      }
    }
    
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

  // Simple chat proxy to backend to avoid exposing API keys in the browser
  export async function chat(messages: Array<{ role: string; content: string }>, opts?: { model?: string; temperature?: number; max_tokens?: number }) {
    const headers = { 'Content-Type': 'application/json', ...(await withAuthHeaders()) };
    const res = await fetch(`${API}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages, ...opts }),
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<{ reply: string }>;
  }

  // Grammar evaluation via backend to avoid exposing OpenAI keys
  export type GrammarEvaluatePayload = {
    text: string;
    image_id?: string | null;
    mode?: string | null; // "minimal" | "fluency"
    dialect?: string | null; // e.g. "en-GB" | "en-US"
    grade_level?: number | null;
  };

  export type GrammarEvaluateResponse = {
    corrected: string;
    diff: Array<{ op: 'equal' | 'replace'; token: string }>
    explanations: string[];
    score: number;
    tags: { [k: string]: number };
    confidence: string;
    context_score?: number;
    context_passed?: boolean;
    grammar_score?: number;
  };

  export async function evaluateGrammar(payload: GrammarEvaluatePayload): Promise<GrammarEvaluateResponse> {
    const headers = { 'Content-Type': 'application/json', ...(await withAuthHeaders()) };
    const res = await fetch(`${API}/api/grammar/evaluate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }