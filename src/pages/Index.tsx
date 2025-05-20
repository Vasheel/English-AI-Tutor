
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import SubjectCard from "@/components/SubjectCard";
import ProgressChart from "@/components/ProgressChart";
import AchievementBadge from "@/components/AchievementBadge";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const subjects = [
    {
      title: "Math",
      icon: "🧮",
      color: "bg-edu-purple",
      progress: 75,
      route: "/exercises",
    },
    {
      title: "Science",
      icon: "🔬",
      color: "bg-edu-green",
      progress: 60,
      route: "/quizzes?subject=science",
    },
    {
      title: "English",
      icon: "📚",
      color: "bg-edu-blue",
      progress: 85,
      route: "/quizzes?subject=english",
    },
    {
      title: "History",
      icon: "🏛️",
      color: "bg-edu-yellow",
      progress: 45,
      route: "/quizzes?subject=history",
    },
  ];

  const achievements = [
    {
      icon: "🔢",
      title: "Math Whiz",
      description: "Complete 10 math exercises with a perfect score",
      achieved: true,
      color: "bg-edu-purple bg-opacity-30",
    },
    {
      icon: "🧪",
      title: "Science Explorer",
      description: "Finish all science quizzes",
      achieved: true,
      color: "bg-edu-green bg-opacity-30",
    },
    {
      icon: "⭐",
      title: "Perfect Streak",
      description: "Maintain a 5-day learning streak",
      achieved: true,
      color: "bg-edu-yellow bg-opacity-30",
    },
    {
      icon: "🏆",
      title: "Quiz Champion",
      description: "Score 100% on 5 quizzes",
      achieved: false,
      color: "bg-edu-orange bg-opacity-30",
    },
    {
      icon: "📝",
      title: "Essay Master",
      description: "Complete all writing assignments",
      achieved: false,
      color: "bg-edu-pink bg-opacity-30",
    },
  ];

  return (
    <div className="min-h-screen bg-edu-bg">
      <NavBar />
      <div className="container mx-auto py-8 px-4">
        {/* Welcome Section */}
        <div className="bg-white rounded-3xl p-8 shadow-md mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-2/3 mb-6 lg:mb-0 lg:pr-8">
              <h1 className="text-4xl font-bold mb-4 text-edu-purple">
                Welcome back, Student!
              </h1>
              <p className="text-lg mb-6 text-gray-600">
                Ready to continue learning? Today is a great day to keep building your knowledge!
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() => navigate("/exercises")}
                  className="bg-edu-blue hover:bg-blue-500 text-white font-medium px-6 py-2"
                >
                  Practice Exercises
                </Button>
                <Button
                  onClick={() => navigate("/quizzes")}
                  className="bg-edu-purple hover:bg-edu-light-purple text-white font-medium px-6 py-2"
                >
                  Take a Quiz
                </Button>
              </div>
            </div>
            <div className="lg:w-1/3 flex justify-center">
              <img
                src="https://cdn.pixabay.com/photo/2018/04/18/18/56/ux-3331508_1280.png"
                alt="Learning illustration"
                className="max-w-full h-auto lg:max-h-60 animate-float"
              />
            </div>
          </div>
        </div>

        {/* Subject Cards */}
        <h2 className="text-2xl font-bold mb-6">Your Subjects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.title}
              title={subject.title}
              icon={subject.icon}
              color={subject.color}
              progress={subject.progress}
              route={subject.route}
            />
          ))}
        </div>

        {/* Progress Chart & Achievements Section */}
        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          <div className="lg:w-2/3">
            <h2 className="text-2xl font-bold mb-6">Your Progress</h2>
            <ProgressChart />
          </div>
          
          <div className="lg:w-1/3">
            <h2 className="text-2xl font-bold mb-6">Achievements</h2>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex flex-wrap gap-4 justify-center mb-4">
                {achievements.map((badge) => (
                  <AchievementBadge
                    key={badge.title}
                    icon={badge.icon}
                    title={badge.title}
                    description={badge.description}
                    achieved={badge.achieved}
                    color={badge.color}
                  />
                ))}
              </div>
              <Button
                onClick={() => navigate("/progress")}
                variant="outline"
                className="w-full mt-4"
              >
                View All Achievements
              </Button>
            </div>
          </div>
        </div>
        
        {/* Daily Challenge Section */}
        <div className="bg-gradient-to-r from-edu-purple to-edu-blue rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-8 text-white">
            <h2 className="text-2xl font-bold mb-2">Daily Challenge</h2>
            <p className="mb-4">Complete today's challenge to earn extra points!</p>
            <Button
              onClick={() => navigate("/exercises")}
              className="bg-white text-edu-purple hover:bg-opacity-90"
            >
              Start Challenge
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
