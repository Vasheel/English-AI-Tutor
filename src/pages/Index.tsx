import NavBar from "@/components/NavBar";
import SubjectCard from "@/components/SubjectCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useLocation } from 'react-router-dom';
import SpeakButton from "@/components/SpeakButton";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const subjects = [
    {
      title: "English Grammar",
      icon: "✍️",
      color: "bg-edu-blue",
      progress: 35,
      route: "/grammar"
    },
    {
      title: "Educational Games",
      icon: "🎮",
      color: "bg-edu-purple",
      progress: 40,
      route: "/games"
    },
    {
      title: "Reading Comprehension",
      icon: "📚",
      color: "bg-edu-orange",
      progress: 30,
      route: "/reading"
    },
    {
      title: "Progress Tracking",
      icon: "📊",
      color: "bg-edu-green",
      progress: 70,
      route: "/progress"
    },
    {
      title: "Grammar Exercises",
      icon: "📝",
      color: "bg-edu-cyan",
      progress: 25,
      route: "/exercise-generator"
    },
    {
      title: "Close Test",
      icon: "✏️",
      color: "bg-edu-indigo",
      progress: 45,
      route: "/cloze"
    },
    {
      title: "Cultural Vocabulary",
      icon: "🇲🇺",
      color: "bg-green-500",
      progress: 0,
      route: "/cultural-vocabulary"
    },
    {
      title: "Smart Quiz",
      icon: "🎯",
      color: "bg-edu-violet",
      progress: 30,
      route: "/adaptive-quiz"
    },
    {
      title: "Image Quiz",
      icon: "🎨",
      color: "bg-edu-rose",
      progress: 40,
      route: "/image-quiz"
    },
    {
      title: "PSAC Chat",
      icon: "💬",
      color: "bg-edu-teal",
      progress: 100,
      route: "/chat"
    },
    {
      title: "Topic Questions",
      icon: "🤖",
      color: "bg-edu-amber",
      progress: 35,
      route: "/ai-demo"
    }
  ];

  return (
    <div className="min-h-screen bg-edu-bg">
      <NavBar />
      
      {/* Top Left Speak Button */}
      <SpeakButton />
      
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-edu-dark">
            Welcome to LearnQuest
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your AI-powered learning companion for 6th grade success! Practice English, play educational games, and track your progress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {subjects.map((subject, index) => (
            <SubjectCard
              key={index}
              title={subject.title}
              icon={subject.icon}
              color={subject.color}
              progress={subject.progress}
              route={subject.route}
            />
          ))}
        </div>

        <Card className="bg-gradient-to-r from-edu-purple to-edu-light-purple text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Ready to Learn?</CardTitle>
            <CardDescription className="text-white/90 text-lg">
              Start with any subject that interests you most. Every small step counts!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-bold">AI-Powered</div>
                <div className="text-sm">Grammar Help</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-bold">Fun Games</div>
                <div className="text-sm">Interactive Learning</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-bold">Progress</div>
                <div className="text-sm">Track Improvement</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-sm">Available</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
