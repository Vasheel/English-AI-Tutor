import NavBar from "@/components/NavBar";
import SubjectCard from "@/components/SubjectCard";
import GrammarCorrector from "@/components/GrammarCorrector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
const subjects = [
  {
    title: "English Grammar",
    icon: "✍️",
    color: "bg-edu-blue",
    progress: 45,
    route: "/grammar"
  },
  {
    title: "Progress Tracking",
    icon: "📊",
    color: "bg-edu-green",
    progress: 70,
    route: "/progress"
  }
];

;

  return (
    <div className="min-h-screen bg-edu-bg">
      <NavBar />
      
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-edu-dark">
            Welcome to LearnQuest
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your AI-powered learning companion for 6th grade success! Practice math, improve your English, and track your progress.
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

       <div className="text-center mt-8">
  <a href="#grammar">
    <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
      Try Grammar Correction
    </button>
  </a>
</div>

        <div id="grammar" className="mb-12">
          <div className="text-center mb-8">
            <h2 id="grammar" className="text-2xl font-bold mt-12 mb-4">AI Grammar Helper</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Practice writing and get instant, friendly feedback on your grammar. Perfect for improving your English skills!
            </p>
          </div>
          <GrammarCorrector />
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
                <div className="text-2xl font-bold">500+</div>
                <div className="text-sm">Practice Problems</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-bold">AI</div>
                <div className="text-sm">Powered Help</div>
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
