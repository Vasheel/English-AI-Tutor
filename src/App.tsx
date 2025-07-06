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
              <Route path="/chat" element={
                <ProtectedRoute>
                  <ChatBot 
                    systemPrompt="You are an English learning assistant. Focus on grammar correction and vocabulary improvement." 
                    model="gpt-3.5-turbo"
                  />
                </ProtectedRoute>
              } />
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
