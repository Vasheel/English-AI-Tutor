import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Star, CheckCircle, ArrowLeft, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TopicStorySelector from "./TopicStorySelector";
import ClozeTestComponent from "./ClozeTestComponent";
import { useAIStoryGeneration } from "@/hooks/useAIStoryGeneration";
import VoiceControls from "@/components/VoiceControls";

interface ReadingModuleProps {
  level: number;
  onProgress: (points: number) => void;
}

type ReadingMode = 'select' | 'predefined' | 'topic-story' | 'comprehension' | 'cloze-test';
interface TopicStory {
  title: string;
  content: string;
  topic: string;
  difficulty: number;
  questions: Array<{
    question: string;
    options: string[];
    correct: string;
  }>;
};

type ClozeTest = {
  text: string;
  answers: string[];
};

const ReadingModule = ({ level, onProgress }: ReadingModuleProps) => {
  const [mode, setMode] = useState<ReadingMode>('select');
  const [selectedStory, setSelectedStory] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [comprehensionComplete, setComprehensionComplete] = useState(false);
  const [currentStory, setCurrentStory] = useState<TopicStory | null>(null);
  const [clozeTest, setClozeTest] = useState<ClozeTest | null>(null);
  const [clozeScore, setClozeScore] = useState(0);
  const { toast } = useToast();
  const { generateClozeTest } = useAIStoryGeneration();

  const stories = useMemo(() => [
    {
      id: 1,
      title: "The Helpful Dolphin",
      level: 1,
      content: `Once upon a time, there was a kind dolphin named Splash who lived in the warm, blue waters near a small island. Splash loved to help others and was known throughout the ocean for his kindness.

One sunny morning, a little girl named Maya was swimming near the shore when she got caught in a strong current. The waves were pulling her away from the beach, and she couldn't swim back.

"Help! Help!" Maya called out, feeling scared and tired.

Splash heard her cries and quickly swam to where she was struggling. "Don't worry," said Splash gently. "Climb onto my back, and I'll take you to safety."

Maya carefully climbed onto Splash's smooth back. The dolphin swam slowly and carefully back to the shallow water where Maya could stand up safely.

"Thank you so much, Splash!" said Maya, smiling with relief. "You saved my life!"

From that day on, Maya and Splash became the best of friends. Maya would visit the beach every day, and Splash would swim up to say hello. They would play games in the water and share stories.

The other animals in the ocean admired Splash for his bravery and kindness. He had shown that helping others is one of the most important things we can do.`,
      questions: [
        {
          question: "What was the dolphin's name?",
          options: ["Splash", "Wave", "Blue", "Ocean"],
          correct: "Splash"
        },
        {
          question: "Why did Maya need help?",
          options: [
            "She lost her toy",
            "She got caught in a strong current", 
            "She couldn't find her parents",
            "She was hungry"
          ],
          correct: "She got caught in a strong current"
        },
        {
          question: "How did Splash help Maya?",
          options: [
            "He called for help",
            "He gave her food",
            "He let her ride on his back to safety",
            "He taught her to swim"
          ],
          correct: "He let her ride on his back to safety"
        },
        {
          question: "What happened after Splash saved Maya?",
          options: [
            "Maya never went swimming again",
            "They became best friends",
            "Splash moved to another ocean",
            "Maya forgot about Splash"
          ],
          correct: "They became best friends"
        }
      ]
    },
    {
      id: 2,
      title: "The Magic Garden",
      level: 2,
      content: `In a quiet neighborhood, there lived an elderly woman named Mrs. Chen who had the most beautiful garden anyone had ever seen. Her garden was special because it seemed to have a touch of magic.

Every morning, Mrs. Chen would wake up early and tend to her plants with great care. She would water them, talk to them, and even sing gentle songs. The flowers in her garden grew bigger and more colorful than anywhere else in the town.

One day, a young boy named Alex noticed something unusual. When Mrs. Chen spoke kindly to her roses, they seemed to bloom even brighter. When she told her vegetables how proud she was of them, they grew faster and healthier.

Alex was curious and decided to ask Mrs. Chen about her secret. "Mrs. Chen," he said politely, "how do you make your plants grow so beautifully?"

Mrs. Chen smiled warmly and replied, "The secret isn't magic, dear Alex. It's love, patience, and hard work. When you care for something with your whole heart, it flourishes."

She invited Alex to help her in the garden. She taught him how to plant seeds properly, how much water each plant needed, and how to remove weeds gently. Most importantly, she showed him how to speak encouragingly to the plants.

After several weeks of working together, Alex noticed that his section of the garden was also growing magnificently. He realized that Mrs. Chen was right – the real magic was the love and attention they gave to their plants.

News of the magical garden spread throughout the neighborhood. Many people came to learn from Mrs. Chen, and soon the entire street was filled with beautiful, thriving gardens. The community became closer as neighbors shared gardening tips and helped each other.`,
      questions: [
        {
          question: "What made Mrs. Chen's garden special?",
          options: [
            "It was very large",
            "It seemed to have a touch of magic",
            "It had expensive plants",
            "It was near a river"
          ],
          correct: "It seemed to have a touch of magic"
        },
        {
          question: "What did Alex notice about Mrs. Chen's interaction with her plants?",
          options: [
            "She only watered them",
            "She spoke kindly and they bloomed brighter",
            "She used special fertilizer",
            "She played music for them"
          ],
          correct: "She spoke kindly and they bloomed brighter"
        },
        {
          question: "According to Mrs. Chen, what was the real secret to her garden's success?",
          options: [
            "Magic spells",
            "Expensive tools",
            "Love, patience, and hard work",
            "Special soil"
          ],
          correct: "Love, patience, and hard work"
        },
        {
          question: "What happened to the neighborhood at the end of the story?",
          options: [
            "Nothing changed",
            "People moved away",
            "The street was filled with beautiful gardens and the community became closer",
            "Mrs. Chen stopped gardening"
          ],
          correct: "The street was filled with beautiful gardens and the community became closer"
        }
      ]
    }
  ], []);

  const generateAIStory = useCallback(async () => {
    try {
      const result = await generateClozeTest(currentStory?.content);
      setCurrentStory({
        ...currentStory,
        content: result.text
      });
      setClozeTest(result);
    } catch (error) {
      console.error('Error generating story:', error);
      toast({
        title: "Error",
        description: "Failed to generate story. Please try again.",
        variant: "destructive",
      });
    }
  }, [currentStory, generateClozeTest, setCurrentStory, setClozeTest, toast]);

  useEffect(() => {
    const handleSpeechInput = (text: string) => {
      const lowerText = text.toLowerCase();
      
      // Handle story selection
      if (mode === 'select') {
        if (lowerText.includes('choose') || lowerText.includes('select')) {
          setMode('topic-story');
          toast({
            title: "Reading Mode",
            description: "Please choose a topic or story to read.",
          });
        } else if (lowerText.includes('random story')) {
          setMode('predefined');
          setSelectedStory(Math.floor(Math.random() * stories.length));
          toast({
            title: "Reading Mode",
            description: "Starting a random story.",
          });
        } else if (lowerText.includes('cloze test')) {
          setMode('cloze-test');
          generateAIStory();
          toast({
            title: "Reading Mode",
            description: "Starting cloze test mode.",
          });
        }
      }
      
      // Handle topic selection
      if (mode === 'topic-story') {
        if (lowerText.includes('animals') || lowerText.includes('nature')) {
          setSelectedStory(1);
        } else if (lowerText.includes('space') || lowerText.includes('astronomy')) {
          setSelectedStory(2);
        } else if (lowerText.includes('history') || lowerText.includes('past')) {
          setSelectedStory(3);
        }
      }
    };

    // Listen for speech input events
    window.addEventListener('speech-input', (event: CustomEvent) => {
      if (event.detail?.text) {
        handleSpeechInput(event.detail.text);
      }
    });

    return () => {
      window.removeEventListener('speech-input', () => {});
    };
  }, [mode, stories, generateAIStory,toast]);

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);
    
    if (currentStory && answer === currentStory.questions[currentQuestion].correct) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (currentStory && currentQuestion < currentStory.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        completeComprehension();
      }
    }, 2000);
  };

  const completeComprehension = () => {
    setComprehensionComplete(true);
    const points = score * 5;
    onProgress(points);
    
    toast({
      title: "Reading complete!",
      description: `You answered ${score}/${currentStory?.questions.length} questions correctly and earned ${points} points!`,
    });
  };

  const handleTopicStoryGenerated = (story: TopicStory) => {
    setCurrentStory(story);
    setMode('topic-story');
  };

  const startClozeTest = () => {
    const storyContent = currentStory?.content;
    if (storyContent) {
      const test = generateClozeTest(storyContent);
      setClozeTest(test);
      setMode('cloze-test');
    }
  };

  const handleClozeComplete = (score: number) => {
    setClozeScore(score);
    const points = score * 3; // 3 points per correct cloze answer
    onProgress(points);
  };

  const resetToModeSelect = () => {
    setMode('select');
    setSelectedStory(null);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
    setComprehensionComplete(false);
    setCurrentStory(null);
    setClozeTest(null);
    setClozeScore(0);
  };

  const handleSpeechInput = useCallback((transcript: string) => {
    console.log('Speech input:', transcript);
  }, []);

  // Mode Selection Screen
  if (mode === 'select') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-500" />
              Reading Adventures
            </CardTitle>
            <p className="text-gray-600">
              Choose how you'd like to practice reading today!
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card 
                className="cursor-pointer hover:scale-105 transition-transform border-2 hover:border-purple-300"
                onClick={() => setMode('topic-story')}
              >
                <CardContent className="p-6 text-center">
                  <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">AI Story Generator</h3>
                  <p className="text-gray-600 mb-4">
                    Choose a topic and get a personalized story with comprehension questions and cloze tests!
                  </p>
                  <Badge className="bg-purple-500 text-white">
                    ✨ New Feature!
                  </Badge>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:scale-105 transition-transform border-2 hover:border-blue-300"
                onClick={() => setMode('predefined')}
              >
                <CardContent className="p-6 text-center">
                  <BookOpen className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Classic Stories</h3>
                  <p className="text-gray-600 mb-4">
                    Read carefully crafted stories with comprehension questions.
                  </p>
                  <Badge variant="secondary">
                    {stories.filter(story => story.level <= level + 1).length} Stories
                  </Badge>
                </CardContent>
              </Card>
            </div>
            <VoiceControls onSpeechInput={handleSpeechInput} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Topic Story Selection
  if (mode === 'topic-story' && !currentStory) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" onClick={resetToModeSelect}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <TopicStorySelector 
          onStoryGenerated={handleTopicStoryGenerated}
          difficulty={level}
        />
      </div>
    );
  }

  // Cloze Test Mode
  if (mode === 'cloze-test' && clozeTest) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" onClick={() => setMode('topic-story')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Story
          </Button>
        </div>
        <ClozeTestComponent
          text={clozeTest.text}
          answers={clozeTest.answers}
          onComplete={handleClozeComplete}
          onRestart={() => setMode('topic-story')}
        />
      </div>
    );
  }

  // Generated Story Display
  if (mode === 'topic-story' && currentStory) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" onClick={resetToModeSelect}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-500" />
              {currentStory.title}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Topic: {currentStory.topic}</Badge>
              <Badge variant="secondary">Level {currentStory.difficulty}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none mb-8">
              <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                {currentStory.content}
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={startClozeTest} className="flex-1">
                📝 Try Fill-in-the-Blanks
              </Button>
              <Button onClick={resetToModeSelect} variant="outline" className="flex-1">
                🔄 Generate New Story
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Predefined Stories Mode
  if (mode === 'predefined') {
    if (comprehensionComplete && currentStory) {
      return (
        <div className="max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Star className="h-6 w-6 text-yellow-500" />
                Reading Adventure Complete!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-6xl">📚</div>
              <div>
                <div className="text-3xl font-bold text-blue-600">
                  {score}/{currentStory.questions.length}
                </div>
                <div className="text-lg text-gray-600">
                  Comprehension Score
                </div>
              </div>
              
              <div className="space-y-2">
                {score === currentStory.questions.length && (
                  <Badge className="bg-yellow-500 text-white text-lg px-4 py-2">
                    Perfect Understanding! 🌟
                  </Badge>
                )}
                {score >= currentStory.questions.length * 0.75 && score < currentStory.questions.length && (
                  <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                    Great Reading! 📖
                  </Badge>
                )}
              </div>

              <div className="flex gap-4">
                <Button onClick={startClozeTest} className="flex-1">
                  📝 Try Cloze Test
                </Button>
                <Button onClick={resetToModeSelect} variant="outline" className="flex-1">
                  Choose Different Story
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (selectedStory && currentStory) {
      return (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="outline" onClick={() => setMode('predefined')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-blue-500" />
                {currentStory.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none mb-8">
                <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                  {currentStory.content}
                </div>
              </div>

              <Card className="bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Comprehension Questions ({currentQuestion + 1}/{currentStory.questions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h4 className="text-lg font-semibold mb-4">
                    {currentStory.questions[currentQuestion].question}
                  </h4>
                  
                  <div className="space-y-3">
                    {currentStory.questions[currentQuestion].options.map((option, index) => (
                      <Button
                        key={index}
                        variant={
                          showResult
                            ? option === currentStory.questions[currentQuestion].correct
                              ? "default"
                              : selectedAnswer === option
                              ? "destructive"
                              : "outline"
                            : "outline"
                        }
                        className="w-full text-left justify-start p-4 h-auto"
                        onClick={() => !showResult && handleAnswer(option)}
                        disabled={showResult}
                      >
                        <span className="mr-3 font-bold">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        {option}
                        {showResult && option === currentStory.questions[currentQuestion].correct && (
                          <CheckCircle className="h-4 w-4 ml-auto text-green-600" />
                        )}
                      </Button>
                    ))}
                  </div>

                  <div className="mt-4 text-sm text-gray-600">
                    Score: {score}/{currentQuestion + (showResult ? 1 : 0)}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" onClick={resetToModeSelect}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-500" />
              Classic Reading Stories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Choose a story to read and answer comprehension questions. Stories are selected based on your reading level.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {stories.filter(story => story.level <= level + 1).map((story) => (
                <Card 
                  key={story.id}
                  className="hover:scale-105 transition-transform cursor-pointer border-2 hover:border-blue-300"
                  onClick={() => setSelectedStory(story.id)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{story.title}</CardTitle>
                      <Badge variant={story.level <= level ? "default" : "secondary"}>
                        Level {story.level}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4">
                      {story.content.substring(0, 100)}...
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {story.questions.length} questions
                      </span>
                      <Button size="sm">
                        Start Reading
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default ReadingModule;
