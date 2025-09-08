import GrammarTutor from "./pages/GrammarTutor";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Exercises from "./pages/Exercises";
import Grammar from "./pages/Grammar";
import Quizzes from "./pages/Quizzes";
import Progress from "./pages/Progress";
import Games from "./pages/Games";
import ReadingPage from "@/pages/Reading";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import VoiceControls from "@/components/VoiceControls";
import ChatBot from "@/components/ChatBot";
import { ProgressProvider } from "./components/games/ProgressContext";
import ExerciseGenerator from "@/components/ExerciseGenerator";
import AIQuestionDemo from "@/components/AIQuestionDemo";
import AdaptiveQuizSystem from "@/components/AdaptiveQuizSystem";
import ImageQuiz from "@/pages/ImageQuiz";
import DiagnosticPage from './pages/DiagnosticPage';
import InteractiveClozeTestSystem from '@/components/InteractiveClozeTestSystem';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
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
              <Route path="/chat" element={
                <ProtectedRoute>
                  <ChatBot 
                    systemPrompt="You are a PSAC (Primary School Achievement Certificate) Grade 6 English tutor for Mauritius. Always answer within the PSAC syllabus and exam style: clear explanations, age-appropriate vocabulary, short steps, and 1–2 PSAC-style examples. When users ask general questions, relate the answer to PSAC topics (grammar, vocabulary, comprehension, writing). If off‑syllabus, briefly redirect and connect to a relevant PSAC concept." 
                    model="gpt-3.5-turbo"
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
                         

              <Route path="*" element={<NotFound />} />
            </Routes>
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
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
