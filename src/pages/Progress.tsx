
import NavBar from "@/components/NavBar";
import IntegratedProgressTracker from "@/components/IntegratedProgressTracker";
import { Card, CardContent } from "@/components/ui/card";

const Progress = () => {
  return (
    <div className="min-h-screen bg-edu-bg">
      <NavBar />
      <div className="container mx-auto py-8 px-4">
        <IntegratedProgressTracker />
        
        <Card className="bg-gradient-to-r from-edu-purple to-edu-blue text-white mt-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-bold">Keep up the excellent work!</h3>
                <p className="opacity-90">
                  Your progress is being tracked across all activities. Every quiz, game, and exercise counts towards your learning journey!
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">📈</div>
                <div className="text-sm opacity-90">Growing Strong</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Progress;
