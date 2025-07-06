import { ProgressContextType } from "./ProgressContextExports";
import { Star, Target, Zap, BookOpen, Clock, Shield, Trophy, ShieldCheck, Book, Clock12, User, CheckCircle2, CircleDot, Flame, TrendingUp, ArrowUp, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Achievement {
  id: string;
  name: string;
  icon: React.ElementType;
  progress: number;
  requirement: string;
  unlocked: boolean;
}

const achievements: Achievement[] = [
  {
    id: "welcome",
    name: "Welcome",
    icon: User,
    progress: 100,
    requirement: "Welcome to English AI Tutor!",
    unlocked: true,
  },
  {
    id: "first-login",
    name: "First Login",
    icon: CheckCircle2,
    progress: 100,
    requirement: "Completed your first login",
    unlocked: true,
  },
  {
    id: "quiz-master",
    name: "Quiz Master",
    icon: Trophy,
    progress: 0,
    requirement: "Complete 5 quizzes",
    unlocked: false,
  },
  {
    id: "word-expert",
    name: "Word Expert",
    icon: Book,
    progress: 0,
    requirement: "Master 100 words",
    unlocked: false,
  },
  {
    id: "streak-keeper",
    name: "Streak Keeper",
    icon: Clock12,
    progress: 0,
    requirement: "Maintain a 5-day streak",
    unlocked: false,
  },
];

interface ProgressDisplayProps {
  progress: ProgressContextType['progress'];
}

const getAccuracyColor = (accuracy: number) => {
  if (accuracy >= 90) return "text-green-600 bg-green-50";
  if (accuracy >= 70) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
};

const AchievementBadge = ({ achievement }: { achievement: Achievement }) => {
  const [isOpen, setIsOpen] = useState(false);

  const calculateProgressColor = (progress: number) => {
    if (achievement.unlocked) return "text-green-500 bg-green-50";
    if (progress >= 70) return "text-yellow-500 bg-yellow-50";
    return "text-gray-400 bg-gray-50";
  };

  const calculateProgressRingColor = (progress: number) => {
    if (achievement.unlocked) return "bg-green-500";
    if (progress >= 70) return "bg-yellow-500";
    return "bg-gray-400";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="group relative cursor-pointer">
            <div className={`p-6 rounded-xl shadow-sm transition-all ${calculateProgressColor(achievement.progress)}`}>
              <div className="flex items-center justify-center mb-2">
                <achievement.icon className="h-6 w-6" />
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{achievement.name}</div>
                <div className="text-sm text-gray-600">{achievement.progress}% Complete</div>
              </div>
              <div className="mt-4">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 rounded-full bg-gray-200" />
                  <div
                    className={`absolute inset-0 rounded-full ${calculateProgressRingColor(achievement.progress)}`}
                    style={{
                      clipPath: `circle(${achievement.progress}% at 50% 50%)`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white">
                    <div className="text-sm font-medium">
                      {achievement.progress}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="p-4 rounded-lg bg-white shadow-lg border border-gray-200">
          <h3 className="font-semibold mb-2">{achievement.name}</h3>
          <p className="text-gray-600">{achievement.requirement}</p>
          <div className="mt-2 text-sm">
            Progress: {achievement.progress}%
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export function ProgressDisplay({ progress }: ProgressDisplayProps) {
  // Update achievements progress based on user progress
  useEffect(() => {
    // This would typically be done on the backend
    // Here we're just showing example logic
    const updatedAchievements = achievements.map(achievement => {
      switch (achievement.id) {
        case "quiz-master":
          return { ...achievement, progress: Math.min(100, (progress.totalAttempts / 5) * 100) };
        case "word-expert":
          return { ...achievement, progress: Math.min(100, (progress.wordsMastered / 100) * 100) };
        case "streak-keeper":
          return { ...achievement, progress: Math.min(100, (progress.consecutiveCorrect / 5) * 100) };
        default:
          return achievement;
      }
    });

    // This would typically update the state in a real app
    // For now, we're just showing the logic
    console.log(updatedAchievements);
  }, [progress]);

  return (
    <div className="mb-6 p-4 bg-white rounded-xl shadow-md border border-gray-200">
      <h3 className="text-2xl font-bold mb-6 text-center">English Progress</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {/* Score */}
        <div className="text-center p-6 bg-blue-50 rounded-xl shadow-sm">
          <div className="text-blue-500 mb-2">
            <Star className="h-6 w-6" />
          </div>
          <div className="text-3xl font-bold text-blue-700">{progress.score}</div>
          <div className="text-sm text-gray-600">Score</div>
        </div>

        {/* Accuracy (with color coding) */}
        <div className={`text-center p-6 rounded-xl shadow-sm ${getAccuracyColor(progress.accuracy)}`}>
          <div className="text-green-500 mb-2">
            <Target className="h-6 w-6" />
          </div>
          <div className="text-3xl font-bold">{progress.accuracy.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Accuracy</div>
        </div>

        {/* Level */}
        <div className="text-center p-6 bg-purple-50 rounded-xl shadow-sm">
          <div className="text-purple-500 mb-2">
            <Shield className="h-6 w-6" />
          </div>
          <div className="text-3xl font-bold text-purple-700">{progress.currentLevel}</div>
          <div className="text-sm text-gray-600">Level</div>
        </div>

        {/* Words Mastered */}
        <div className="text-center p-6 bg-green-50 rounded-xl shadow-sm">
          <div className="text-green-500 mb-2">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="text-2xl font-bold text-green-700">{progress.wordsMastered}</div>
          <div className="text-sm text-gray-600">Words Mastered</div>
        </div>

        {/* Streak */}
        <div className="text-center p-6 bg-yellow-50 rounded-xl shadow-sm">
          <div className="text-yellow-500 mb-2">
            <Zap className="h-6 w-6" />
          </div>
          <div className="text-2xl font-bold text-yellow-700">{progress.consecutiveCorrect}</div>
          <div className="text-sm text-gray-600">Streak</div>
        </div>

        {/* Attempts */}
        <div className="text-center p-6 bg-gray-50 rounded-xl shadow-sm">
          <div className="text-gray-500 mb-2">
            <Clock className="h-6 w-6" />
          </div>
          <div className="text-2xl font-bold text-gray-700">{progress.totalAttempts}</div>
          <div className="text-sm text-gray-600">Attempts</div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map(achievement => (
            <AchievementBadge key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </div>
    </div>
  );
}
