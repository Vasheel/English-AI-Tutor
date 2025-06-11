
import { useEffect, useState } from "react";
import { getProgress, getSessions, UserProgress, ActivitySession } from "@/utils/progressTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, TrendingUp, Clock, Star, AlertCircle } from "lucide-react";

const ProgressDashboard = () => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [sessions, setSessions] = useState<ActivitySession[]>([]);

  useEffect(() => {
    setProgress(getProgress());
    setSessions(getSessions());
  }, []);

  if (!progress) return null;

  const totalAttempts = progress.grammarAttempts + progress.wordScrambleAttempts + progress.sentenceBuilderAttempts;
  const totalScore = progress.grammarScore + progress.wordScrambleScore + progress.sentenceBuilderScore;
  const overallAccuracy = totalAttempts > 0 ? (totalScore / totalAttempts) * 100 : 0;

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "text-green-600";
    if (accuracy >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const recentSessions = sessions.slice(-5).reverse();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 Your Learning Dashboard</h1>
        <p className="text-gray-600">Track your progress and celebrate your achievements!</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{totalScore}</div>
            <div className="text-sm text-gray-600">Correct Answers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${getAccuracyColor(overallAccuracy)}`}>
              {Math.round(overallAccuracy)}%
            </div>
            <div className="text-sm text-gray-600">Overall Accuracy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{progress.totalTimeSpent}</div>
            <div className="text-sm text-gray-600">Minutes Practiced</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{progress.achievements.length}</div>
            <div className="text-sm text-gray-600">Achievements</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activity Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span>Grammar Correction</span>
                <span className="text-sm text-gray-600">
                  {progress.grammarScore}/{progress.grammarAttempts}
                </span>
              </div>
              <Progress 
                value={progress.grammarAttempts > 0 ? (progress.grammarScore / progress.grammarAttempts) * 100 : 0} 
                className="h-2"
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span>Word Scramble</span>
                <span className="text-sm text-gray-600">
                  {progress.wordScrambleScore}/{progress.wordScrambleAttempts}
                </span>
              </div>
              <Progress 
                value={progress.wordScrambleAttempts > 0 ? (progress.wordScrambleScore / progress.wordScrambleAttempts) * 100 : 0} 
                className="h-2"
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span>Sentence Builder</span>
                <span className="text-sm text-gray-600">
                  {progress.sentenceBuilderScore}/{progress.sentenceBuilderAttempts}
                </span>
              </div>
              <Progress 
                value={progress.sentenceBuilderAttempts > 0 ? (progress.sentenceBuilderScore / progress.sentenceBuilderAttempts) * 100 : 0} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progress.achievements.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {progress.achievements.map((achievement, index) => (
                  <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                    <Star className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                    <div className="text-xs font-medium text-yellow-800">{achievement}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                Start practicing to earn achievements! 🌟
              </div>
            )}
          </CardContent>
        </Card>

        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Your Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progress.strengths.length > 0 ? (
              <div className="space-y-2">
                {progress.strengths.map((strength, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-2">
                    <div className="text-sm font-medium text-green-800">✅ {strength}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                Keep practicing to discover your strengths! 💪
              </div>
            )}
          </CardContent>
        </Card>

        {/* Areas to Improve */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progress.areasToImprove.length > 0 ? (
              <div className="space-y-2">
                {progress.areasToImprove.map((area, index) => (
                  <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                    <div className="text-sm font-medium text-orange-800">🎯 {area}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                You're doing great! Keep up the good work! 🎉
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {recentSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentSessions.map((session, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <div className="font-medium">{session.activity}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(session.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${getAccuracyColor((session.score / session.totalQuestions) * 100)}`}>
                      {session.score}/{session.totalQuestions}
                    </div>
                    <div className="text-sm text-gray-600">{session.timeSpent}m</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgressDashboard;
