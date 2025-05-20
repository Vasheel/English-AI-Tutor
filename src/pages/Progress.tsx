
import NavBar from "@/components/NavBar";
import ProgressChart from "@/components/ProgressChart";
import AchievementBadge from "@/components/AchievementBadge";
import StudentProgressCard from "@/components/StudentProgressCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Progress = () => {
  const achievements = [
    // Math achievements
    {
      icon: "🔢",
      title: "Math Beginner",
      description: "Complete your first math exercise",
      achieved: true,
      color: "bg-edu-purple bg-opacity-30",
    },
    {
      icon: "🧮",
      title: "Math Enthusiast",
      description: "Complete 10 math exercises",
      achieved: true,
      color: "bg-edu-purple bg-opacity-30",
    },
    {
      icon: "📐",
      title: "Math Whiz",
      description: "Get a perfect score on 5 math quizzes",
      achieved: false,
      color: "bg-edu-purple bg-opacity-30",
    },
    // Science achievements
    {
      icon: "🔬",
      title: "Science Explorer",
      description: "Complete your first science quiz",
      achieved: true,
      color: "bg-edu-green bg-opacity-30",
    },
    {
      icon: "🧪",
      title: "Science Investigator",
      description: "Complete all science quizzes",
      achieved: false,
      color: "bg-edu-green bg-opacity-30",
    },
    {
      icon: "🔭",
      title: "Science Genius",
      description: "Score 100% on all science quizzes",
      achieved: false,
      color: "bg-edu-green bg-opacity-30",
    },
    // English achievements
    {
      icon: "📚",
      title: "Bookworm",
      description: "Complete your first English quiz",
      achieved: true,
      color: "bg-edu-blue bg-opacity-30",
    },
    {
      icon: "✏️",
      title: "Wordsmith",
      description: "Complete 10 English exercises",
      achieved: true,
      color: "bg-edu-blue bg-opacity-30",
    },
    {
      icon: "📝",
      title: "Essay Master",
      description: "Submit all writing assignments",
      achieved: false,
      color: "bg-edu-blue bg-opacity-30",
    },
    // History achievements
    {
      icon: "🏛️",
      title: "History Buff",
      description: "Complete your first History quiz",
      achieved: true,
      color: "bg-edu-yellow bg-opacity-30",
    },
    {
      icon: "🗿",
      title: "Time Traveler",
      description: "Complete all history quizzes",
      achieved: false,
      color: "bg-edu-yellow bg-opacity-30",
    },
    {
      icon: "🏆",
      title: "History Scholar",
      description: "Score 90% or higher on all history quizzes",
      achieved: false,
      color: "bg-edu-yellow bg-opacity-30",
    },
    // Special achievements
    {
      icon: "⭐",
      title: "Rising Star",
      description: "Complete at least one quiz in each subject",
      achieved: true,
      color: "bg-edu-orange bg-opacity-30",
    },
    {
      icon: "🔥",
      title: "On Fire",
      description: "Maintain a 3-day learning streak",
      achieved: true,
      color: "bg-edu-orange bg-opacity-30",
    },
    {
      icon: "💯",
      title: "Perfect Score",
      description: "Get 100% on any quiz",
      achieved: true,
      color: "bg-edu-pink bg-opacity-30",
    },
  ];

  const progressData = [
    {
      subject: "Math",
      progress: 75,
      color: "bg-edu-purple",
      exercisesCompleted: 32,
      quizzesCompleted: 8,
    },
    {
      subject: "Science",
      progress: 60,
      color: "bg-edu-green",
      exercisesCompleted: 18,
      quizzesCompleted: 5,
    },
    {
      subject: "English",
      progress: 85,
      color: "bg-edu-blue",
      exercisesCompleted: 45,
      quizzesCompleted: 10,
    },
    {
      subject: "History",
      progress: 45,
      color: "bg-edu-yellow",
      exercisesCompleted: 12,
      quizzesCompleted: 3,
    },
  ];

  const activityData = [
    { day: "Monday", exercises: 5, quizzes: 2 },
    { day: "Tuesday", exercises: 4, quizzes: 1 },
    { day: "Wednesday", exercises: 7, quizzes: 3 },
    { day: "Thursday", exercises: 3, quizzes: 1 },
    { day: "Friday", exercises: 6, quizzes: 2 },
    { day: "Saturday", exercises: 2, quizzes: 0 },
    { day: "Sunday", exercises: 0, quizzes: 0 },
  ];

  return (
    <div className="min-h-screen bg-edu-bg">
      <NavBar />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">Your Learning Progress</h1>
        <p className="text-gray-600 mb-8">
          Track your achievements and monitor your academic growth.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Progress Report</CardTitle>
                <CardDescription>Your learning journey over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ProgressChart />
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <StudentProgressCard data={progressData} />
          </div>
        </div>

        <Tabs defaultValue="achievements" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="activity">Weekly Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle>Your Achievements</CardTitle>
                <CardDescription>Badges you've earned through learning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 justify-items-center py-4">
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
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
                <CardDescription>Your learning activities this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 md:gap-4">
                  {activityData.map((day) => (
                    <div key={day.day} className="text-center">
                      <div className="text-sm font-medium mb-2">{day.day.substring(0, 3)}</div>
                      <div className="flex flex-col space-y-2 items-center">
                        <div className="relative w-full">
                          <div className="h-24 bg-gray-100 rounded-t-lg w-full"></div>
                          <div 
                            className="absolute bottom-0 w-full bg-edu-purple rounded-t-lg transition-all duration-500"
                            style={{ height: `${(day.exercises / 8) * 100}%`, maxHeight: "100%" }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                            {day.exercises}
                          </div>
                        </div>
                        <div className="relative w-full">
                          <div className="h-24 bg-gray-100 rounded-t-lg w-full"></div>
                          <div 
                            className="absolute bottom-0 w-full bg-edu-blue rounded-t-lg transition-all duration-500"
                            style={{ height: `${(day.quizzes / 3) * 100}%`, maxHeight: "100%" }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                            {day.quizzes}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 flex items-center justify-center">
                          <span className="w-3 h-3 rounded-full bg-edu-purple inline-block mr-1"></span>
                          <span>Ex</span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center justify-center">
                          <span className="w-3 h-3 rounded-full bg-edu-blue inline-block mr-1"></span>
                          <span>Qz</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="bg-gradient-to-r from-edu-purple to-edu-blue text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-bold">Keep up the good work!</h3>
                <p className="opacity-90">
                  You're making great progress. Challenge yourself to learn something new every day!
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">67%</div>
                <div className="text-sm opacity-90">Overall Mastery</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Progress;
