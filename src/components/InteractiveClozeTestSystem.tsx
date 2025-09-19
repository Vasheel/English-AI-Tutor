import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useSupabaseProgress } from '@/hooks/useSupabaseProgress';
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Sparkles,
  Trophy,
  Target,
  BookOpen,
  GraduationCap,
  Lightbulb,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

// Types
interface ClozeTest {
  id: string;
  title: string;
  text: string;
  processedText: string;
  answers: string[];
  hints?: string[];
  wordBank?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  marks: number;
  topic: string;
}

interface TestResult {
  score: number;
  total: number;
  percentage: number;
  feedback: string;
  incorrectAnswers: number[];
}

// Test Data
const clozeTestsData: Record<string, ClozeTest[]> = {
  beginner: [
    {
      id: 'beginner-1',
      title: 'The Little Bird',
      text: 'Once upon a time, there was a little bird. Every _____ the bird would start _____ beautiful songs. It lived in a big _____ near the river. The bird was very _____ because it had many friends. One day, it _____ away to find new adventures.',
      processedText: 'Once upon a time, there was a little bird. Every [BLANK] the bird would start [BLANK] beautiful songs. It lived in a big [BLANK] near the river. The bird was very [BLANK] because it had many friends. One day, it [BLANK] away to find new adventures.',
      answers: ['morning', 'singing', 'tree', 'happy', 'flew'],
      wordBank: ['morning', 'singing', 'tree', 'happy', 'flew', 'evening', 'dancing', 'house'],
      hints: ['Time of day', 'Making music', 'Where birds live', 'Feeling', 'Movement'],
      difficulty: 'beginner',
      marks: 5,
      topic: 'Animals & Nature'
    },
    {
      id: 'beginner-2',
      title: 'My School Day',
      text: 'I wake up at seven o\'clock in the _____. After breakfast, I _____ to school by bus. My favorite _____ is mathematics. During lunch, I eat _____ my friends. After school, I always do my _____ before playing.',
      processedText: 'I wake up at seven o\'clock in the [BLANK]. After breakfast, I [BLANK] to school by bus. My favorite [BLANK] is mathematics. During lunch, I eat [BLANK] my friends. After school, I always do my [BLANK] before playing.',
      answers: ['morning', 'go', 'subject', 'with', 'homework'],
      difficulty: 'beginner',
      marks: 5,
      topic: 'School Life'
    },
    {
      id: 'beginner-3',
      title: 'The Picnic',
      text: 'Last Sunday, my family went for a picnic. We drove _____ the beach. The weather was _____ and warm. My mother prepared delicious _____ for everyone. We played games and _____ in the sea. It was the _____ day of my summer vacation.',
      processedText: 'Last Sunday, my family went for a picnic. We drove [BLANK] the beach. The weather was [BLANK] and warm. My mother prepared delicious [BLANK] for everyone. We played games and [BLANK] in the sea. It was the [BLANK] day of my summer vacation.',
      answers: ['to', 'sunny', 'food', 'swam', 'best'],
      difficulty: 'beginner',
      marks: 5,
      topic: 'Family & Leisure'
    },
    {
      id: 'beginner-4',
      title: 'My Pet Cat',
      text: 'I have a pet cat named Fluffy. She has soft _____ and green eyes. Every day, she likes to _____ in the sunshine. When she is hungry, she _____ loudly. She loves to play with a small _____. At night, she sleeps on my _____.',
      processedText: 'I have a pet cat named Fluffy. She has soft [BLANK] and green eyes. Every day, she likes to [BLANK] in the sunshine. When she is hungry, she [BLANK] loudly. She loves to play with a small [BLANK]. At night, she sleeps on my [BLANK].',
      answers: ['fur', 'sleep', 'meows', 'ball', 'bed'],
      difficulty: 'beginner',
      marks: 5,
      topic: 'Pets'
    },
    {
      id: 'beginner-5',
      title: 'The Garden',
      text: 'My grandmother has a beautiful garden. She grows many _____ and vegetables. In spring, the roses _____ with lovely colors. She waters the plants every _____. Sometimes, butterflies come to _____ the garden. I help her pick the ripe _____ from the plants.',
      processedText: 'My grandmother has a beautiful garden. She grows many [BLANK] and vegetables. In spring, the roses [BLANK] with lovely colors. She waters the plants every [BLANK]. Sometimes, butterflies come to [BLANK] the garden. I help her pick the ripe [BLANK] from the plants.',
      answers: ['flowers', 'bloom', 'day', 'visit', 'tomatoes'],
      difficulty: 'beginner',
      marks: 5,
      topic: 'Nature & Gardening'
    }
  ],
  intermediate: [
    {
      id: 'intermediate-1',
      title: 'The Clever Crow',
      text: 'A thirsty crow was searching for water on a hot summer day. After flying for _____, it finally spotted a pitcher with some water at the _____. However, the water level was too _____ for the crow to reach. The clever bird didn\'t give _____. It started dropping small stones into the pitcher. Gradually, the water _____ to the top. The crow was able to _____ the water and satisfy its thirst.',
      processedText: 'A thirsty crow was searching for water on a hot summer day. After flying for [BLANK], it finally spotted a pitcher with some water at the [BLANK]. However, the water level was too [BLANK] for the crow to reach. The clever bird didn\'t give [BLANK]. It started dropping small stones into the pitcher. Gradually, the water [BLANK] to the top. The crow was able to [BLANK] the water and satisfy its thirst.',
      answers: ['hours', 'bottom', 'low', 'up', 'rose', 'drink'],
      difficulty: 'intermediate',
      marks: 6,
      topic: 'Moral Stories'
    },
    {
      id: 'intermediate-2',
      title: 'The Science Fair',
      text: 'Sarah had been preparing for the science fair for _____. Her project was about renewable _____ sources. She built a small model that _____ how solar panels work. On the day of the fair, many students were _____ by her presentation. The judges asked several _____ which Sarah answered confidently. She won first _____ for her innovative project.',
      processedText: 'Sarah had been preparing for the science fair for [BLANK]. Her project was about renewable [BLANK] sources. She built a small model that [BLANK] how solar panels work. On the day of the fair, many students were [BLANK] by her presentation. The judges asked several [BLANK] which Sarah answered confidently. She won first [BLANK] for her innovative project.',
      answers: ['weeks', 'energy', 'demonstrated', 'impressed', 'questions', 'prize'],
      difficulty: 'intermediate',
      marks: 6,
      topic: 'Education & Science'
    },
    {
      id: 'intermediate-3',
      title: 'Ocean Conservation',
      text: 'Our oceans are facing serious _____ from pollution and overfishing. Plastic waste is particularly _____ to marine life. Many species are now _____ due to human activities. Scientists are working hard to find _____ to these problems. Everyone can help by _____ plastic use and supporting sustainable fishing. The future of our oceans _____ on our actions today.',
      processedText: 'Our oceans are facing serious [BLANK] from pollution and overfishing. Plastic waste is particularly [BLANK] to marine life. Many species are now [BLANK] due to human activities. Scientists are working hard to find [BLANK] to these problems. Everyone can help by [BLANK] plastic use and supporting sustainable fishing. The future of our oceans [BLANK] on our actions today.',
      answers: ['threats', 'harmful', 'endangered', 'solutions', 'reducing', 'depends'],
      difficulty: 'intermediate',
      marks: 6,
      topic: 'Environment'
    },
    {
      id: 'intermediate-4',
      title: 'The Ancient Library',
      text: 'The archaeologists discovered an ancient library buried _____ the desert sand. The scrolls and manuscripts had been _____ for thousands of years. Each document contained valuable _____ about past civilizations. The team worked carefully to _____ the ancient texts. This discovery would help historians _____ how people lived in ancient times. Museums around the world were _____ to display these treasures.',
      processedText: 'The archaeologists discovered an ancient library buried [BLANK] the desert sand. The scrolls and manuscripts had been [BLANK] for thousands of years. Each document contained valuable [BLANK] about past civilizations. The team worked carefully to [BLANK] the ancient texts. This discovery would help historians [BLANK] how people lived in ancient times. Museums around the world were [BLANK] to display these treasures.',
      answers: ['beneath', 'preserved', 'information', 'translate', 'understand', 'eager'],
      difficulty: 'intermediate',
      marks: 6,
      topic: 'History & Archaeology'
    },
    {
      id: 'intermediate-5',
      title: 'Technology in Education',
      text: 'Technology has dramatically _____ the way students learn today. Online courses make education _____ to people worldwide. Interactive software helps students _____ difficult concepts at their own pace. However, excessive screen time can be _____ to young children. Teachers must find the right _____ between traditional and digital learning methods. The goal is to _____ students for a technology-driven future.',
      processedText: 'Technology has dramatically [BLANK] the way students learn today. Online courses make education [BLANK] to people worldwide. Interactive software helps students [BLANK] difficult concepts at their own pace. However, excessive screen time can be [BLANK] to young children. Teachers must find the right [BLANK] between traditional and digital learning methods. The goal is to [BLANK] students for a technology-driven future.',
      answers: ['changed', 'accessible', 'practice', 'harmful', 'balance', 'prepare'],
      difficulty: 'intermediate',
      marks: 6,
      topic: 'Technology & Education'
    }
  ],
  advanced: [
    {
      id: 'advanced-1',
      title: 'The Elephant and the Ants',
      text: 'The ants had a plan. They went straight into _____ elephant\'s trunk. They _____ biting him. The elephant _____ in pain. He understood that small animals could be _____. He apologised _____ the ants. This story teaches an important lesson. We need to be humble and treat everyone kindly.',
      processedText: 'The ants had a plan. They went straight into [BLANK] elephant\'s trunk. They [BLANK] biting him. The elephant [BLANK] in pain. He understood that small animals could be [BLANK]. He apologised [BLANK] the ants. This story teaches an important lesson. We need to be humble and treat everyone kindly.',
      answers: ['the', 'started', 'was', 'powerful', 'to'],
      difficulty: 'advanced',
      marks: 5,
      topic: 'PSAC - Moral Stories'
    },
    {
      id: 'advanced-2',
      title: 'Climate Change Mitigation',
      text: 'The unprecedented rate of climate change poses an existential _____ to humanity. Scientists have reached a _____ that human activities are the primary cause. Carbon emissions must be drastically _____ within this decade. Renewable energy technologies offer viable _____ to fossil fuels. However, the transition requires substantial _____ and political will. Individual actions, though important, cannot _____ for systemic change. The future of our planet hinges on collective _____ taken today.',
      processedText: 'The unprecedented rate of climate change poses an existential [BLANK] to humanity. Scientists have reached a [BLANK] that human activities are the primary cause. Carbon emissions must be drastically [BLANK] within this decade. Renewable energy technologies offer viable [BLANK] to fossil fuels. However, the transition requires substantial [BLANK] and political will. Individual actions, though important, cannot [BLANK] for systemic change. The future of our planet hinges on collective [BLANK] taken today.',
      answers: ['threat', 'consensus', 'reduced', 'alternatives', 'investment', 'substitute', 'action'],
      difficulty: 'advanced',
      marks: 7,
      topic: 'Environment & Science'
    },
    {
      id: 'advanced-3',
      title: 'The Digital Revolution',
      text: 'Artificial intelligence is rapidly _____ every aspect of modern society. While it promises unprecedented _____ and innovation, it also raises profound ethical _____. The automation of jobs could lead to widespread _____ if not properly managed. Privacy has become increasingly _____ in our interconnected world. Policymakers struggle to _____ technologies that evolve faster than legislation. Society must carefully _____ these challenges to harness AI\'s benefits responsibly.',
      processedText: 'Artificial intelligence is rapidly [BLANK] every aspect of modern society. While it promises unprecedented [BLANK] and innovation, it also raises profound ethical [BLANK]. The automation of jobs could lead to widespread [BLANK] if not properly managed. Privacy has become increasingly [BLANK] in our interconnected world. Policymakers struggle to [BLANK] technologies that evolve faster than legislation. Society must carefully [BLANK] these challenges to harness AI\'s benefits responsibly.',
      answers: ['transforming', 'efficiency', 'concerns', 'unemployment', 'vulnerable', 'regulate', 'navigate'],
      difficulty: 'advanced',
      marks: 7,
      topic: 'Technology & Society'
    },
    {
      id: 'advanced-4',
      title: 'The Renaissance Legacy',
      text: 'The Renaissance period marked a profound _____ in European intellectual and artistic expression. Humanism _____ as a dominant philosophy, emphasizing individual potential. Artists like Leonardo da Vinci _____ the Renaissance ideal of the polymath. Scientific inquiry began to _____ long-held religious dogmas. The printing press democratized _____, accelerating the spread of ideas. This cultural revolution laid the _____ for modern Western civilization. Its influence continues to _____ in contemporary thought and art.',
      processedText: 'The Renaissance period marked a profound [BLANK] in European intellectual and artistic expression. Humanism [BLANK] as a dominant philosophy, emphasizing individual potential. Artists like Leonardo da Vinci [BLANK] the Renaissance ideal of the polymath. Scientific inquiry began to [BLANK] long-held religious dogmas. The printing press democratized [BLANK], accelerating the spread of ideas. This cultural revolution laid the [BLANK] for modern Western civilization. Its influence continues to [BLANK] in contemporary thought and art.',
      answers: ['shift', 'emerged', 'epitomized', 'challenge', 'knowledge', 'foundation', 'resonate'],
      difficulty: 'advanced',
      marks: 7,
      topic: 'History & Culture'
    },
    {
      id: 'advanced-5',
      title: 'Biodiversity Crisis',
      text: 'The current rate of species extinction _____ natural background rates by a thousand fold. Habitat destruction remains the primary _____ behind biodiversity loss. Ecosystems are intricate webs where each species plays a _____ role in maintaining balance. The disappearance of keystone species can trigger cascading _____ throughout entire food chains. Conservation efforts must _____ local communities and indigenous knowledge. Economic incentives need to _____ with ecological preservation. Without immediate intervention, we risk _____ damage to Earth\'s life-support systems.',
      processedText: 'The current rate of species extinction [BLANK] natural background rates by a thousand fold. Habitat destruction remains the primary [BLANK] behind biodiversity loss. Ecosystems are intricate webs where each species plays a [BLANK] role in maintaining balance. The disappearance of keystone species can trigger cascading [BLANK] throughout entire food chains. Conservation efforts must [BLANK] local communities and indigenous knowledge. Economic incentives need to [BLANK] with ecological preservation. Without immediate intervention, we risk [BLANK] damage to Earth\'s life-support systems.',
      answers: ['exceeds', 'culprit', 'crucial', 'effects', 'integrate', 'align', 'irreversible'],
      difficulty: 'advanced',
      marks: 7,
      topic: 'Environment & Conservation'
    }
  ]
};

// Component
export default function InteractiveClozeTestSystem() {
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [selectedTestIndex, setSelectedTestIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [animateCorrect, setAnimateCorrect] = useState<number[]>([]);
  const [dynamicTests, setDynamicTests] = useState<Record<'beginner'|'intermediate'|'advanced', ClozeTest[]>>({
    beginner: [],
    intermediate: [],
    advanced: []
  });
  const [loadingAI, setLoadingAI] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  // Hide the left "Select Test" list per level
  const showTestList = false;

  // Progress tracking
  const { updateProgress, addSession } = useSupabaseProgress();

  const currentTests = [
    ...(dynamicTests[selectedLevel] || []),
    ...clozeTestsData[selectedLevel]
  ];
  const currentTest = currentTests[selectedTestIndex];

  useEffect(() => {
    // Reset when changing test or level
    setUserAnswers(new Array(currentTest.answers.length).fill(''));
    setShowResults(false);
    setShowAnswers(false);
    setTestResult(null);
    setShowHints(false);
    setAnimateCorrect([]);
    setStartTime(Date.now()); // Reset timer for new test
  }, [selectedLevel, selectedTestIndex, currentTest.answers.length]);

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
  };

  const getAcceptableAnswers = (correctAnswer: string): string[] => {
    const variations: Record<string, string[]> = {
      'the': ['the'],
      'started': ['started', 'began'],
      'was': ['was', 'felt'],
      'powerful': ['powerful', 'dangerous', 'strong'],
      'to': ['to'],
      // Add more variations as needed
    };
    return variations[correctAnswer.toLowerCase()] || [correctAnswer.toLowerCase()];
  };

  const checkAnswers = async () => {
    let correct = 0;
    const incorrectIndices: number[] = [];
    const newAnimateCorrect: number[] = [];

    userAnswers.forEach((answer, index) => {
      const acceptableAnswers = getAcceptableAnswers(currentTest.answers[index]);
      if (acceptableAnswers.includes(answer.toLowerCase().trim())) {
        correct++;
        newAnimateCorrect.push(index);
      } else if (answer.trim() !== '') {
        incorrectIndices.push(index);
      }
    });

    const total = currentTest.answers.length;
    const percentage = Math.round((correct / total) * 100);
    
    let feedback = '';
    if (percentage === 100) {
      feedback = '🎉 Perfect! You got all answers correct!';
    } else if (percentage >= 70) {
      feedback = `👍 Great job! You got ${correct} out of ${total} correct.`;
    } else {
      feedback = `📚 Keep practicing! You got ${correct} out of ${total} correct.`;
    }

    setTestResult({
      score: correct,
      total,
      percentage,
      feedback,
      incorrectAnswers: incorrectIndices
    });

    setShowResults(true);
    setAnimateCorrect(newAnimateCorrect);

    // Update progress tracking
    const timeSpent = Math.max(1, Math.floor((Date.now() - startTime) / 1000)); // in seconds
    const isCorrect = percentage >= 70; // 70% threshold for "correct" attempt
    
    try {
      // Update Supabase progress
      await updateProgress("cloze", {
        total_attempts: 1, // This will be incremented by the hook
        correct_answers: isCorrect ? 1 : 0,
        total_time_spent: timeSpent,
        current_streak: isCorrect ? 1 : 0,
        best_streak: isCorrect ? 1 : 0
      });

      // Add session record  
      await addSession({
        user_id: '', // Will be filled by the hook
        activity_type: 'cloze',
        score: correct,
        total_questions: total,
        time_spent: Math.round(Number(timeSpent) || 0),
        difficulty_level: Number(selectedLevel) || 1
      });
    } catch (error) {
      console.error("Error updating cloze test progress:", error);
    }

    // Animate correct answers
    setTimeout(() => {
      setAnimateCorrect([]);
    }, 1000);
  };

  const resetTest = () => {
    setUserAnswers(new Array(currentTest.answers.length).fill(''));
    setShowResults(false);
    setShowAnswers(false);
    setTestResult(null);
    setShowHints(false);
    setStartTime(Date.now()); // Reset timer for new attempt
  };

  const revealAnswers = () => {
    setUserAnswers([...currentTest.answers]);
    setShowAnswers(true);
    setShowResults(true);
    setTestResult({
      score: currentTest.answers.length,
      total: currentTest.answers.length,
      percentage: 100,
      feedback: '📖 Here are the correct answers. Study them carefully!',
      incorrectAnswers: []
    });
  };

  const renderTestContent = () => {
    const parts = currentTest.text.split('_____');
    return (
      <div className="text-lg leading-relaxed space-y-2">
        {parts.map((part, index) => (
          <span key={index}>
            {part}
            {index < currentTest.answers.length && (
              <>
                <Input
                  className={`inline-block w-32 mx-2 text-center transition-all duration-300 ${
                    showResults && userAnswers[index]
                      ? getAcceptableAnswers(currentTest.answers[index]).includes(userAnswers[index].toLowerCase().trim())
                        ? 'border-green-500 bg-green-50'
                        : userAnswers[index].trim() === ''
                        ? 'border-gray-300'
                        : 'border-red-500 bg-red-50'
                      : 'border-blue-400 hover:border-blue-500'
                  } ${animateCorrect.includes(index) ? 'scale-110' : ''}`}
                  value={userAnswers[index]}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  placeholder={showHints && currentTest.hints ? currentTest.hints[index] : `blank ${index + 1}`}
                  disabled={showAnswers}
                />
                {showResults && !getAcceptableAnswers(currentTest.answers[index]).includes(userAnswers[index].toLowerCase().trim()) && userAnswers[index].trim() !== '' && (
                  <span className="text-green-600 text-sm ml-1">({currentTest.answers[index]})</span>
                )}
              </>
            )}
          </span>
        ))}
      </div>
    );
  };

  // --- Backend integration: Fetch AI cloze test ---
  const fetchDynamicTest = async (level: string) => {
    const response = await fetch('/api/quizzes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty: level, type: 'cloze', count: 1 })
    });
    return response.json();
  };

  type ApiItem = { title?: string; text?: string; passage?: string; answers?: string[]; blanks?: Array<{ answer: string }>; topic?: string };
  const toClozeFromApi = (apiData: unknown, level: 'beginner'|'intermediate'|'advanced'): ClozeTest | null => {
    try {
      const asObj = (apiData as Record<string, unknown>) || {};
      const items = (asObj['items'] as ApiItem[] | undefined);
      const item: ApiItem = (items && items[0]) || (asObj['cloze'] as ApiItem) || (asObj as ApiItem);
      const title = item.title || 'AI Generated Cloze';
      const text = String(item.text || item.passage || '');
      const answers: string[] = item.answers || item.blanks?.map((b) => String(b.answer)) || [];

      // If no explicit blanks, try building by hiding provided answers once
      if (text && answers?.length) {
        let work = text;
        answers.forEach((ans) => {
          const esc = ans.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const re = new RegExp(`\\b${esc}\\b`, 'i');
          work = work.replace(re, '_____');
        });
        if (!work.includes('_____')) {
          // fallback: mark first 5 words as blanks
          const words = work.split(/(\s+)/);
          for (let i=0, blanks=0; i<words.length && blanks<Math.min(answers.length,5); i+=2, blanks++) {
            answers[blanks] = words[i];
            words[i] = '_____';
          }
          work = words.join('');
        }
        return {
          id: `ai-${Date.now()}`,
          title,
          text: work,
          processedText: work.replace(/_____/g,'[BLANK]'),
          answers: answers.map((a: string) => String(a)),
          difficulty: level,
          marks: answers.length || 5,
          topic: item.topic || 'AI Generated'
        };
      }
    } catch (e) {
      console.warn('Failed to parse AI cloze:', e);
    }
    return null;
  };

  const generateAiTest = async () => {
    try {
      setLoadingAI(true);
      const data = await fetchDynamicTest(selectedLevel);
      const cloze = toClozeFromApi(data, selectedLevel);
      if (cloze) {
        setDynamicTests(prev => ({
          ...prev,
          [selectedLevel]: [cloze, ...(prev[selectedLevel] || [])]
        }));
        setSelectedTestIndex(0);
      } else {
        console.warn('API did not return a compatible cloze test. Falling back to static datasets.');
      }
    } catch (e) {
      console.error('AI cloze fetch failed:', e);
    } finally {
      setLoadingAI(false);
    }
  };

  const levelColors = {
    beginner: 'bg-gradient-to-r from-green-400 to-green-600',
    intermediate: 'bg-gradient-to-r from-yellow-400 to-orange-500',
    advanced: 'bg-gradient-to-r from-red-500 to-purple-600'
  };

  const levelIcons = {
    beginner: <BookOpen className="w-5 h-5" />,
    intermediate: <Target className="w-5 h-5" />,
    advanced: <GraduationCap className="w-5 h-5" />
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6 border-0 shadow-xl bg-gradient-to-r from-purple-600 to-indigo-600">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold text-white flex items-center justify-center gap-3">
              <Sparkles className="w-10 h-10" />
              Interactive Close Test Practice System
            </CardTitle>
            <p className="text-white/90 mt-2 text-lg">
              Master your English comprehension skills with progressive exercises
            </p>
          </CardHeader>
        </Card>

        {/* Level Selector */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <Button
                  key={level}
                  onClick={() => {
                    setSelectedLevel(level);
                    setSelectedTestIndex(0);
                  }}
                  className={`flex-1 py-6 text-lg font-semibold transition-all duration-300 ${
                    selectedLevel === level
                      ? levelColors[level] + ' text-white shadow-lg transform scale-105'
                      : 'bg-white text-gray-700 border-2 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {levelIcons[level]}
                    <span className="capitalize">{level}</span>
                  </div>
                </Button>
              ))}
            </div>
            <div className="flex justify-center mt-4">
              <Button onClick={generateAiTest} disabled={loadingAI} className="px-6">
                {loadingAI ? 'Generating…' : 'Generate AI Test'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        {showTestList ? (
          <div className="grid md:grid-cols-4 gap-6">
            {/* Test Selector Sidebar */}
            <Card className="md:col-span-1 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Select Test
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {currentTests.map((test, index) => (
                  <Button
                    key={test.id}
                    onClick={() => setSelectedTestIndex(index)}
                    variant={selectedTestIndex === index ? 'default' : 'outline'}
                    className="w-full justify-start text-left"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">Test {index + 1}</span>
                      <span className="text-xs opacity-80">{test.title}</span>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Test Content */}
            <Card className="md:col-span-3 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">{currentTest.title}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-sm">
                      {currentTest.marks} marks
                    </Badge>
                    <Badge className={levelColors[selectedLevel] + ' text-white'}>
                      {selectedLevel}
                    </Badge>
                  </div>
                </div>
                <p className="text-gray-600 mt-2">
                  Topic: {currentTest.topic} | Fill in the blanks with appropriate words
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Instructions */}
                <Alert className="bg-blue-50 border-blue-200">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Read the passage carefully and fill in each blank with ONE suitable word.
                    {currentTest.hints && ' Hints are available if you need help!'}
                  </AlertDescription>
                </Alert>
                {/* Word Bank (if available) */}
                {currentTest.wordBank && selectedLevel === 'beginner' && (
                  <Card className="bg-purple-50 border-purple-200">
                    <CardHeader>
                      <CardTitle className="text-sm text-purple-700">Word Bank (Optional Help)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {currentTest.wordBank.map((word, index) => (
                          <Badge key={index} variant="secondary" className="px-3 py-1">
                            {word}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* Test Text */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  {renderTestContent()}
                </div>
                {/* Hints Toggle */}
                {currentTest.hints && !showResults && (
                  <Button onClick={() => setShowHints(!showHints)} variant="outline" size="sm" className="gap-2">
                    <Lightbulb className="w-4 h-4" />
                    {showHints ? 'Hide Hints' : 'Show Hints'}
                  </Button>
                )}
                {/* Results */}
                {showResults && testResult && (
                  <Alert className={
                    testResult.percentage === 100 ? 'bg-green-50 border-green-200' :
                    testResult.percentage >= 70 ? 'bg-yellow-50 border-yellow-200' :
                    'bg-red-50 border-red-200'
                  }>
                    <div className="flex items-center gap-3">
                      {testResult.percentage === 100 ? (
                        <Trophy className="h-8 w-8 text-yellow-500" />
                      ) : testResult.percentage >= 70 ? (
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                      ) : (
                        <Target className="h-8 w-8 text-blue-500" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{testResult.feedback}</p>
                        <div className="mt-2">
                          <Progress value={testResult.percentage} className="h-2" />
                          <p className="text-sm mt-1">Score: {testResult.percentage}%</p>
                        </div>
                      </div>
                    </div>
                  </Alert>
                )}
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button onClick={checkAnswers} disabled={showResults || userAnswers.every(a => a.trim() === '')} className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Check Answers
                  </Button>
                  <Button onClick={resetTest} variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Reset
                  </Button>
                  <Button onClick={revealAnswers} variant="secondary" className="gap-2">
                    {showAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showAnswers ? 'Hide Answers' : 'Show Answers'}
                  </Button>
                </div>
                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6">
                  <div />
                  <Button onClick={() => setSelectedTestIndex(Math.min(currentTests.length - 1, selectedTestIndex + 1))} disabled={selectedTestIndex === currentTests.length - 1} variant="outline" className="gap-2">
                    Next Test
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">{currentTest.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {currentTest.marks} marks
                  </Badge>
                  <Badge className={levelColors[selectedLevel] + ' text-white'}>
                    {selectedLevel}
                  </Badge>
                </div>
              </div>
              <p className="text-gray-600 mt-2">
                Topic: {currentTest.topic} | Fill in the blanks with appropriate words
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Instructions */}
              <Alert className="bg-blue-50 border-blue-200">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Read the passage carefully and fill in each blank with ONE suitable word.
                  {currentTest.hints && ' Hints are available if you need help!'}
                </AlertDescription>
              </Alert>

              {/* Word Bank (if available) */}
              {currentTest.wordBank && selectedLevel === 'beginner' && (
                <Card className="bg-purple-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-sm text-purple-700">Word Bank (Optional Help)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {currentTest.wordBank.map((word, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1">
                          {word}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Test Text */}
              <div className="bg-gray-50 p-6 rounded-lg">
                {renderTestContent()}
              </div>

              {/* Hints Toggle */}
              {currentTest.hints && !showResults && (
                <Button
                  onClick={() => setShowHints(!showHints)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Lightbulb className="w-4 h-4" />
                  {showHints ? 'Hide Hints' : 'Show Hints'}
                </Button>
              )}

              {/* Results */}
              {showResults && testResult && (
                <Alert className={
                  testResult.percentage === 100 ? 'bg-green-50 border-green-200' :
                  testResult.percentage >= 70 ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }>
                  <div className="flex items-center gap-3">
                    {testResult.percentage === 100 ? (
                      <Trophy className="h-8 w-8 text-yellow-500" />
                    ) : testResult.percentage >= 70 ? (
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    ) : (
                      <Target className="h-8 w-8 text-blue-500" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{testResult.feedback}</p>
                      <div className="mt-2">
                        <Progress value={testResult.percentage} className="h-2" />
                        <p className="text-sm mt-1">Score: {testResult.percentage}%</p>
                      </div>
                    </div>
                  </div>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  onClick={checkAnswers}
                  disabled={showResults || userAnswers.every(a => a.trim() === '')}
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Check Answers
                </Button>
                <Button
                  onClick={resetTest}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </Button>
                <Button
                  onClick={revealAnswers}
                  variant="secondary"
                  className="gap-2"
                >
                  {showAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showAnswers ? 'Hide Answers' : 'Show Answers'}
                </Button>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <Button
                  onClick={() => setSelectedTestIndex(Math.max(0, selectedTestIndex - 1))}
                  disabled={selectedTestIndex === 0}
                  variant="outline"
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous Test
                </Button>
                <Button
                  onClick={() => setSelectedTestIndex(Math.min(currentTests.length - 1, selectedTestIndex + 1))}
                  disabled={selectedTestIndex === currentTests.length - 1}
                  variant="outline"
                  className="gap-2"
                >
                  Next Test
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Overview */}
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {currentTests.filter((_, idx) => idx <= selectedTestIndex).length}
                </div>
                <p className="text-sm text-gray-600">Tests Attempted</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedLevel}
                </div>
                <p className="text-sm text-gray-600">Current Level</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {testResult ? `${testResult.percentage}%` : '-'}
                </div>
                <p className="text-sm text-gray-600">Last Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}