import NavBar from "@/components/NavBar";
import SubjectCard from "@/components/SubjectCard";
import GrammarCorrector from "@/components/GrammarCorrector";
import SupabaseProgressDashboard from "@/components/SupabaseProgressDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabaseProgress } from "@/hooks/useSupabaseProgress";
import { useNavigate, useLocation } from 'react-router-dom';

const Index = () => {
  const { progress } = useSupabaseProgress();
  const location = useLocation();
  const navigate = useNavigate();

  const getProgressForActivity = (activityType: string) => {
    const activityProgress = progress.find(p => p.activity_type === activityType);
    if (!activityProgress || activityProgress.total_attempts === 0) return 0;
    return Math.round((activityProgress.correct_answers / activityProgress.total_attempts) * 100);
  };

  const subjects = [
    {
      title: "English Tutor AI",
      icon: "🤖",
      color: "bg-edu-red",
      progress: 100,
      route: "/"
    },
    {
      title: "English Grammar",
      icon: "✍️",
      color: "bg-edu-blue",
      progress: getProgressForActivity('grammar'),
      route: "/grammar"
    },
    {
      title: "Educational Games",
      icon: "🎮",
      color: "bg-edu-purple",
      progress: Math.max(getProgressForActivity('word_scramble'), getProgressForActivity('sentence_builder')),
      route: "/games"
    },
    {
      title: "Reading Comprehension",
      icon: "📚",
      color: "bg-edu-orange",
      progress: getProgressForActivity('reading'),
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
      title: "Practice Quizzes",
      icon: "📝",
      color: "bg-edu-yellow",
      progress: getProgressForActivity('quizzes'),
      route: "/quizzes"
    },
    {
      title: "English Tutor AI",
      icon: "🤖",
      color: "bg-edu-pink",
      progress: 100,
      route: "/chat"
    }
  ];

  return (
    <div className="min-h-screen bg-edu-bg">
      <NavBar />
      
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-edu-dark">
            Welcome to LearnQuest
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your AI-powered learning companion for 6th grade success! Practice English, play educational games, and track your progress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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

        <Tabs defaultValue="grammar" className="mb-12">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="grammar">AI Grammar Helper</TabsTrigger>
            <TabsTrigger value="progress">Your Progress</TabsTrigger>
          </TabsList>
          
          <TabsContent value="grammar">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">AI Grammar Helper</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Practice writing and get instant, friendly feedback on your grammar. Perfect for improving your English skills!
              </p>
            </div>
            <GrammarCorrector />
          </TabsContent>
          
          <TabsContent value="progress">
            <SupabaseProgressDashboard />
          </TabsContent>
        </Tabs>

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
