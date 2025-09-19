import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext.tsx";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ProgressProvider } from "@/contexts/ProgressContext";
import { lazy, Suspense } from "react";

// Lazy load components for better performance
const GrammarTutor = lazy(() => import("./pages/GrammarTutor"));
const Index = lazy(() => import("./pages/Index"));
const Exercises = lazy(() => import("./pages/Exercises"));
const Grammar = lazy(() => import("./pages/Grammar"));
const Quizzes = lazy(() => import("./pages/Quizzes"));
const Progress = lazy(() => import("./pages/Progress"));
const Games = lazy(() => import("./pages/Games"));
const ReadingPage = lazy(() => import("@/pages/Reading"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const VoiceControls = lazy(() => import("@/components/VoiceControls"));
const ChatBot = lazy(() => import("@/components/ChatBot"));
const ExerciseGenerator = lazy(() => import("@/components/ExerciseGenerator"));
const AIQuestionDemo = lazy(() => import("@/components/AIQuestionDemo"));
const AdaptiveQuizSystem = lazy(() => import("@/components/AdaptiveQuizSystem"));
const ImageQuiz = lazy(() => import("@/pages/ImageQuiz"));
const DiagnosticPage = lazy(() => import('./pages/DiagnosticPage'));
const InteractiveClozeTestSystem = lazy(() => import('@/components/InteractiveClozeTestSystem'));
const SentenceBuilderWithWhisper = lazy(() => import('@/components/games/SentenceBuilderWithWhisper'));
const WhisperDebugTest = lazy(() => import('@/components/WhisperDebugTest'));
const Admin = lazy(() => import('./pages/Admin'));
const CulturalVocabulary = lazy(() => import('@/components/CulturalVocabulary'));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ProgressProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            }>
              <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/exercises" element={
                <ProtectedRoute>
                  <Exercises />
                </ProtectedRoute>
              } />
              <Route path="/grammar" element={
                <ProtectedRoute>
                  <Grammar />
                </ProtectedRoute>
              } />
              <Route path="/games" element={
                <ProtectedRoute>
                  <ProgressProvider>
                    <Games />
                  </ProgressProvider>
                </ProtectedRoute>
              } />
              <Route path="/reading" element={
                <ProtectedRoute>
                  <ReadingPage />
                </ProtectedRoute>
              } />
              <Route path="/cloze" element={
                <ProtectedRoute>
                  <InteractiveClozeTestSystem />
                </ProtectedRoute>
              } />
              <Route path="/quizzes" element={
                <ProtectedRoute>
                  <Quizzes />
                </ProtectedRoute>
              } />
              <Route path="/progress" element={
                <ProtectedRoute>
                  <ProgressProvider>
                    <Progress />
                  </ProgressProvider>
                </ProtectedRoute>
              } />
              <Route path="/grammar-tutor" element={
                <ProtectedRoute>
                  <GrammarTutor />
                </ProtectedRoute>
              } />
              <Route path="/exercise-generator" element={
                <ProtectedRoute>
                  <ExerciseGenerator />
                </ProtectedRoute>
              } />
              
              <Route path="/ai-demo" element={
                <ProtectedRoute>
                  <AIQuestionDemo />
                </ProtectedRoute>
              } />

<Route path="/debug-whisper" element={<WhisperDebugTest />} />

<Route path="/chat" element={
  <ProtectedRoute>
    <ChatBot 
      systemPrompt="You are an English learning assistant for level 6 (PSAC) students in Mauritius. Provide direct, concise answers without excessive examples. Keep all responses to around 20-25 words maximum unless the user specifically requests more detail or asks for a specific word count."
      model={(import.meta.env.VITE_CHAT_MODEL as string) || "gpt-5"}
    />
  </ProtectedRoute>
} />
              <Route path="/adaptive-quiz" element={
                <ProtectedRoute>
                  <AdaptiveQuizSystem />
                </ProtectedRoute>
              } />
              <Route path="/image-quiz" element={
                <ProtectedRoute>
                  <ImageQuiz imageUrl={""} correctKeywords={[]} />
                </ProtectedRoute>
              } />
              <Route path="/diagnostic" element={<DiagnosticPage />} />
              <Route path="/sentence-builder" element={
                <ProtectedRoute>
                  <SentenceBuilderWithWhisper />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/cultural-vocabulary" element={
                <ProtectedRoute>
                  <CulturalVocabulary />
                </ProtectedRoute>
              } />
              
                         

              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <VoiceControls 
              onSpeechInput={(text) => {
                // Handle the speech input here
                console.log('Speech input:', text);
                // You might want to dispatch this to your auth context or handle it in another way
              }}
            />
          </div>
        </BrowserRouter>
        </TooltipProvider>
      </ProgressProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
