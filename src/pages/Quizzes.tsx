import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import NavBar from "@/components/NavBar";
import QuizGenerator from "@/components/QuizGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseProgress } from "@/hooks/useSupabaseProgress";

const Quizzes = () => {
  const location = useLocation();
  const [activeSubject, setActiveSubject] = useState<string>("english");
  const { updateProgress, fetchProgress } = useSupabaseProgress();

  // Parse the subject from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const subject = params.get("subject");
    if (subject && ["math", "science", "english", "history"].includes(subject)) {
      setActiveSubject(subject);
    }
  }, [location]);

  const handleQuizProgress = async (score: number, sessionTime?: number) => {
    try {
      console.log(`🎯 Quiz completed with score: ${score}% in ${sessionTime || 0} seconds`);
      
      // Calculate correct answers based on score percentage
      const totalQuestions = 3; // Quiz has 3 questions
      const correctAnswers = Math.round((score / 100) * totalQuestions);
      
      console.log(`📊 Quiz calculation:`, {
        score,
        totalQuestions,
        correctAnswers,
        sessionTime,
        calculation: `Math.round((${score} / 100) * ${totalQuestions}) = ${correctAnswers}`
      });
      
      // Ensure correct answers cannot exceed total questions
      const finalCorrectAnswers = Math.min(correctAnswers, totalQuestions);
      
      // Use actual session time or default to 5 minutes if not provided
      const actualTimeSpent = sessionTime || 300;
      
      const progressUpdate = {
        total_attempts: totalQuestions, // Each question is an attempt
        correct_answers: finalCorrectAnswers,
        total_time_spent: actualTimeSpent, // Use actual time spent
        current_level: 1,
        current_streak: finalCorrectAnswers === totalQuestions ? 1 : 0,
        best_streak: finalCorrectAnswers === totalQuestions ? 1 : 0
      };
      
      console.log(`📈 Sending progress update:`, progressUpdate);
      console.log(`✅ Validation: ${finalCorrectAnswers} correct <= ${totalQuestions} total attempts`);
      console.log(`⏱️ Time spent: ${actualTimeSpent} seconds (${Math.round(actualTimeSpent / 60)} minutes)`);
      
      await updateProgress("quiz", progressUpdate);
      
      // Refresh progress data to update dashboard
      await fetchProgress();
      
      console.log(`✅ Quiz progress updated successfully`);
    } catch (error) {
      console.error("Error updating quiz progress:", error);
    }
  };

  return (
    <div className="min-h-screen bg-edu-bg">
      <NavBar />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">Knowledge Quizzes</h1>
        <p className="text-gray-600 mb-8">
          Test your understanding with our interactive quizzes.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <QuizGenerator difficulty={"easy"} onProgress={handleQuizProgress} />
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="bg-edu-blue bg-opacity-20 p-2 rounded-lg">
                      <span className="text-2xl">🧠</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">Improve Recall</h3>
                      <p className="text-sm text-gray-600">Quizzes help you remember information longer.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-edu-green bg-opacity-20 p-2 rounded-lg">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">Track Progress</h3>
                      <p className="text-sm text-gray-600">See how your knowledge improves over time.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-edu-purple bg-opacity-20 p-2 rounded-lg">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">Identify Gaps</h3>
                      <p className="text-sm text-gray-600">Find areas where you need more practice.</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-edu-blue to-edu-purple bg-opacity-20">
              <CardContent className="p-6">
                <div className="text-center text-white">
                  <span className="text-3xl block mb-2">⏱️</span>
                  <h3 className="font-bold text-xl mb-1">Time Yourself</h3>
                  <p className="text-sm opacity-90">
                    Try to complete quizzes within 5-7 minutes for better focus and retention!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quizzes;
