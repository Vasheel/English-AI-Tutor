import React, { useState, useEffect } from 'react';
import { useAdaptiveDifficulty } from '@/hooks/useAdaptiveDifficulty';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp, 
  Lightbulb, 
  BarChart3,
  RefreshCw,
  Brain,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface QuestionHistory {
  id: string;
  topic: string;
  question_text: string;
  user_answer?: string;
  correct_answer: string;
  is_correct: boolean;
  response_time: number;
  difficulty_level: number;
  hints_used: number;
  ai_generated: boolean;
  created_at: string;
}

const AdaptiveDifficultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [questionHistory, setQuestionHistory] = useState<QuestionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('word_scramble');

  const {
    currentProgress,
    loading: adaptiveLoading,
    currentDifficulty,
    accuracy,
    avgResponseTime,
    fetchProgress
  } = useAdaptiveDifficulty(selectedTopic);

  const topics = [
    { id: 'word_scramble', name: 'Word Scramble', icon: '🔤' },
    { id: 'grammar', name: 'Grammar', icon: '📝' },
    { id: 'reading', name: 'Reading', icon: '📚' },
    { id: 'quiz', name: 'Quiz', icon: '🧠' }
  ];

  const fetchQuestionHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('question_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('topic', selectedTopic)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setQuestionHistory(data || []);
    } catch (error) {
      console.error('Error fetching question history:', error);
      toast.error('Failed to load question history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionHistory();
  }, [selectedTopic, user]);

  const getDifficultyStats = () => {
    const stats = {
      total: questionHistory.length,
      correct: questionHistory.filter(q => q.is_correct).length,
      avgTime: questionHistory.length > 0 
        ? questionHistory.reduce((sum, q) => sum + q.response_time, 0) / questionHistory.length 
        : 0,
      avgHints: questionHistory.length > 0
        ? questionHistory.reduce((sum, q) => sum + q.hints_used, 0) / questionHistory.length
        : 0,
      difficultyDistribution: {
        1: questionHistory.filter(q => q.difficulty_level === 1).length,
        2: questionHistory.filter(q => q.difficulty_level === 2).length,
        3: questionHistory.filter(q => q.difficulty_level === 3).length
      }
    };

    return stats;
  };

  const getRecentPerformance = () => {
    const recent = questionHistory.slice(0, 10);
    const correct = recent.filter(q => q.is_correct).length;
    return {
      total: recent.length,
      correct,
      accuracy: recent.length > 0 ? (correct / recent.length) * 100 : 0
    };
  };

  const stats = getDifficultyStats();
  const recentPerformance = getRecentPerformance();

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'text-green-600 bg-green-100';
      case 2: return 'text-yellow-600 bg-yellow-100';
      case 3: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (adaptiveLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Brain className="h-8 w-8 text-purple-600" />
          Adaptive Learning Dashboard
        </h1>
        <Button onClick={fetchQuestionHistory} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Topic Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {topics.map((topic) => (
          <Button
            key={topic.id}
            variant={selectedTopic === topic.id ? "default" : "outline"}
            onClick={() => setSelectedTopic(topic.id)}
            className="whitespace-nowrap"
          >
            <span className="mr-2">{topic.icon}</span>
            {topic.name}
          </Button>
        ))}
      </div>

      {/* Current Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Current Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getDifficultyColor(currentDifficulty).split(' ')[0]}`}>
              {currentDifficulty}/3
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {currentDifficulty === 1 ? 'Easy' : currentDifficulty === 2 ? 'Medium' : 'Hard'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {accuracy.toFixed(1)}%
            </div>
            <Progress value={accuracy} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Avg Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {avgResponseTime.toFixed(1)}s
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {avgResponseTime <= 15 ? 'Fast' : avgResponseTime <= 30 ? 'Good' : 'Slow'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Hints Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {currentProgress?.hints_used || 0}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Total hints requested
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Overall Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Questions</span>
              <span className="font-medium">{stats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Correct Answers</span>
              <span className="font-medium text-green-600">{stats.correct}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average Response Time</span>
              <span className="font-medium">{stats.avgTime.toFixed(1)}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average Hints Used</span>
              <span className="font-medium">{stats.avgHints.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Recent Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last 10 Questions</span>
              <span className="font-medium">{recentPerformance.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Recent Accuracy</span>
              <span className="font-medium text-green-600">
                {recentPerformance.accuracy.toFixed(1)}%
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Easy Questions</span>
                <span className="text-green-600">{stats.difficultyDistribution[1]}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Medium Questions</span>
                <span className="text-yellow-600">{stats.difficultyDistribution[2]}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Hard Questions</span>
                <span className="text-red-600">{stats.difficultyDistribution[3]}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Question History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-purple-600" />
            Recent Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {questionHistory.slice(0, 10).map((question, index) => (
              <div key={question.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(question.difficulty_level)}`}>
                      Level {question.difficulty_level}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      question.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {question.is_correct ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                    {question.ai_generated && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        AI Generated
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 truncate">{question.question_text}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>{question.response_time.toFixed(1)}s</span>
                    {question.hints_used > 0 && (
                      <span className="flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" />
                        {question.hints_used}
                      </span>
                    )}
                    <span>{new Date(question.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {questionHistory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No questions attempted yet. Start playing to see your progress!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdaptiveDifficultyDashboard; 