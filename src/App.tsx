
import GrammarTutor from "./pages/GrammarTutor";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Exercises from "./pages/Exercises";
import Grammar from "./pages/Grammar";
import Quizzes from "./pages/Quizzes";
import Progress from "./pages/Progress";
import Games from "./pages/Games";
import ReadingPage from "@/pages/Reading";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/grammar" element={<Grammar />} />
          <Route path="/games" element={<Games />} />
          <Route path="/reading" element={<ReadingPage />} />
          <Route path="/quizzes" element={<Quizzes />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/grammar-tutor" element={<GrammarTutor />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
