import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, RefreshCw } from 'lucide-react';
import { generateAIQuestion, generateMultipleAIQuestions, testAIQuestionGenerator } from '@/utils/generateAIQuestion';
import type { AIQuestionResult } from '@/utils/generateAIQuestion';

const AIQuestionDemo: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<AIQuestionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState<string>('');

  const topics = [
    'tenses',
    'sentence structure', 
    'punctuation',
    'parts of speech',
    'vocabulary',
    'grammar',
    'comprehension'
  ] as const;

  const difficulties = [1, 2, 3] as const;

  const generateQuestion = async (difficulty: 1 | 2 | 3, topic: typeof topics[number]) => {
    setLoading(true);
    setError('');
    setSelectedAnswer('');
    setShowResult(false);

    try {
      console.log(`🎯 Generating ${topic} question (Difficulty ${difficulty})...`);
      
      const question = await generateAIQuestion({
        difficulty,
        topic,
        maxRetries: 3
      });

      setCurrentQuestion(question);
      console.log('✅ Question generated:', question);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Failed to generate question:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateMultipleQuestions = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('🎯 Generating multiple questions...');
      
      const questions = await generateMultipleAIQuestions({
        difficulty: 2,
        topic: 'vocabulary',
        count: 3,
        maxRetries: 2
      });

      console.log('✅ Multiple questions generated:', questions);
      alert(`Generated ${questions.length} questions successfully!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Failed to generate multiple questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const runTest = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('🧪 Running AI question generator test...');
      await testAIQuestionGenerator();
      alert('Test completed! Check console for results.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAnswer = () => {
    if (!currentQuestion) return;
    
    setShowResult(true);
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    console.log(`📊 Answer check: ${selectedAnswer} vs ${currentQuestion.correctAnswer} = ${isCorrect ? '✅ Correct' : '❌ Incorrect'}`);
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'Easy';
      case 2: return 'Medium';
      case 3: return 'Hard';
      default: return 'Unknown';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
          <Brain className="h-8 w-8 text-purple-600" />
          AI Question Generator Demo
        </h1>
        <p className="text-gray-600">Test the AI-powered question generation for Grade 6 students</p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Generate Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Topic and Difficulty Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
              <div className="flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <Button
                    key={topic}
                    variant="outline"
                    size="sm"
                    onClick={() => generateQuestion(2, topic)}
                    disabled={loading}
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <div className="flex gap-2">
                {difficulties.map((difficulty) => (
                  <Button
                    key={difficulty}
                    variant="outline"
                    size="sm"
                    onClick={() => generateQuestion(difficulty, 'vocabulary')}
                    disabled={loading}
                  >
                    {getDifficultyLabel(difficulty)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => generateQuestion(2, 'vocabulary')}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              Generate Single Question
            </Button>
            
            <Button
              onClick={generateMultipleQuestions}
              disabled={loading}
              variant="outline"
            >
              Generate Multiple Questions
            </Button>
            
            <Button
              onClick={runTest}
              disabled={loading}
              variant="outline"
            >
              Run Test Suite
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm">Error: {error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Display */}
      {currentQuestion && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>AI Generated Question</CardTitle>
              <div className="flex gap-2">
                <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                  {getDifficultyLabel(currentQuestion.difficulty)}
                </Badge>
                <Badge variant="outline">{currentQuestion.topic}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-lg font-medium text-gray-900">
              {currentQuestion.question}
            </div>

            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedAnswer === String.fromCharCode(65 + index) ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => setSelectedAnswer(String.fromCharCode(65 + index))}
                  disabled={showResult}
                >
                  <span className="mr-3 font-medium">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </Button>
              ))}
            </div>

            {!showResult && (
              <Button
                onClick={checkAnswer}
                disabled={!selectedAnswer}
                className="w-full"
              >
                Check Answer
              </Button>
            )}

            {showResult && (
              <div className={`p-4 rounded-md ${
                selectedAnswer === currentQuestion.correctAnswer 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-lg ${
                    selectedAnswer === currentQuestion.correctAnswer ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedAnswer === currentQuestion.correctAnswer ? '✅ Correct!' : '❌ Incorrect'}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  <strong>Your answer:</strong> {selectedAnswer}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Correct answer:</strong> {currentQuestion.correctAnswer}
                </p>
                {currentQuestion.explanation && (
                  <p className="text-sm text-blue-600 mt-2">
                    <strong>Explanation:</strong> {currentQuestion.explanation}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>• <strong>Topic buttons:</strong> Generate questions for specific English topics</p>
          <p>• <strong>Difficulty buttons:</strong> Generate questions at different difficulty levels</p>
          <p>• <strong>Generate Single:</strong> Create one AI question</p>
          <p>• <strong>Generate Multiple:</strong> Create multiple questions at once</p>
          <p>• <strong>Run Test:</strong> Test the AI generator with different scenarios</p>
          <p>• <strong>Answer the question:</strong> Click an option and check your answer</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIQuestionDemo; 