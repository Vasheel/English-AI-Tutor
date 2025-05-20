
import NavBar from "@/components/NavBar";
import ExerciseGenerator from "@/components/ExerciseGenerator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Exercises = () => {
  const tips = [
    "Break down complex problems into smaller steps.",
    "Check your work by plugging answers back into the original problem.",
    "Practice regularly to build your math skills.",
    "Write down your work to help track your thinking process.",
    "Don't rush - take your time to understand each problem."
  ];

  return (
    <div className="min-h-screen bg-edu-bg">
      <NavBar />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">Math Exercises</h1>
        <p className="text-gray-600 mb-8">
          Practice your math skills with auto-generated problems.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ExerciseGenerator />
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tips for Success</CardTitle>
                <CardDescription>
                  Follow these tips to improve your math skills
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="mt-1 bg-edu-purple text-white w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs">{index + 1}</span>
                      </div>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-edu-light-purple bg-opacity-20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <span>Your Best Score</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-5xl font-bold text-edu-purple mb-2">18</div>
                  <p className="text-gray-600">Problem streak record</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Exercises;
