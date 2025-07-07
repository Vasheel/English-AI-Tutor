import NavBar from "@/components/NavBar";
import SupabaseProgressDashboard from "@/components/SupabaseProgressDashboard";
import AchievementBadge from "@/components/AchievementBadge";
import StudentProgressCard from "@/components/StudentProgressCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

// Sample data structures
const progressData = [
  {
    subject: "Reading",
    progress: 75,
    color: "bg-blue-500",
    exercisesCompleted: 12,
    quizzesCompleted: 3
  },
  {
    subject: "Grammar",
    progress: 60,
    color: "bg-green-500",
    exercisesCompleted: 8,
    quizzesCompleted: 2
  },
  {
    subject: "Vocabulary",
    progress: 85,
    color: "bg-purple-500",
    exercisesCompleted: 15,
    quizzesCompleted: 4
  }
];

const achievements = [
  {
    icon: "📚",
    title: "Bookworm",
    description: "Complete 10 reading exercises",
    achieved: true,
    color: "bg-blue-500"
  },
  {
    icon: "✍️",
    title: "Grammar Master",
    description: "Score 90% on grammar quizzes",
    achieved: false,
    color: "bg-green-500"
  },
  {
    icon: "🎯",
    title: "Perfect Score",
    description: "Get 100% on any quiz",
    achieved: true,
    color: "bg-yellow-500"
  },
  {
    icon: "🔥",
    title: "Streak Master",
    description: "Practice for 7 days in a row",
    achieved: false,
    color: "bg-red-500"
  },
  {
    icon: "⭐",
    title: "Vocabulary Expert",
    description: "Learn 50 new words",
    achieved: true,
    color: "bg-purple-500"
  }
];

const activityData = [
  { day: "Monday", exercises: 3, quizzes: 1 },
  { day: "Tuesday", exercises: 2, quizzes: 0 },
  { day: "Wednesday", exercises: 4, quizzes: 2 },
  { day: "Thursday", exercises: 1, quizzes: 1 },
  { day: "Friday", exercises: 5, quizzes: 1 },
  { day: "Saturday", exercises: 2, quizzes: 0 },
  { day: "Sunday", exercises: 3, quizzes: 1 }
];

const chartData = [
  { name: "Week 1", math: 65, science: 40, reading: 55, english: 70 },
  { name: "Week 2", math: 70, science: 45, reading: 60, english: 75 },
  { name: "Week 3", math: 75, science: 55, reading: 68, english: 80 },
  { name: "Week 4", math: 80, science: 60, reading: 72, english: 85 },
];

const Progress = () => {
  const [selectedSubject, setSelectedSubject] = useState<'reading' | 'english' | 'math' | 'science'>('english');
  const [viewType, setViewType] = useState<'weekly' | 'cumulative'>('weekly');

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">Your Learning Progress</h1>
        <p className="text-gray-600 mb-8">
          Track your achievements and monitor your academic growth.
        </p>

        {/* Old-style dashboard replacing subject-based cards and chart */}
        <SupabaseProgressDashboard />

        {/*
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Progress Report</CardTitle>
                <CardDescription>Your learning journey over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ProgressChart 
                  data={chartData}
                  selectedSubject={selectedSubject}
                  viewType={viewType}
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <StudentProgressCard data={progressData} />
          </div>
        </div>
        */}

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
