// src/components/games/SentenceBuilderWithWhisper.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { CheckCircle, XCircle, Mic, MicOff, RotateCcw, Lightbulb, Volume2, BarChart3, Shuffle } from 'lucide-react';
import { useWhisperVoiceRecognition } from '@/hooks/useWhisperVoiceRecognition';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import { useToast } from '@/hooks/use-toast';
import { resumeAudioContext } from '@/utils/audioContext';
import { sentenceDatabase, getRandomSentence, Sentence } from '@/data/sentences';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { ProgressDashboard } from '@/components/ProgressCircle';
import { useProgress } from '@/hooks/useProgress';

interface Word {
  id: string;
  text: string;
}

// Remove the local Sentence interface since we're importing it from the database

const SentenceBuilderWithWhisper: React.FC = () => {
  const { toast } = useToast();
  
  // Add this ref at the top of your component:
  const previousBadges = useRef<string[]>([]);
  const previousLevel = useRef<string>('');
  
  // Initialize with student progress tracking
  const {
    progress,
    currentSentence,
    recordAttempt,
    getProgressMetrics,
    nextSentence: hookNextSentence,
    isSentenceCompleted,
    setAttemptStartTime,
    updateStudentProgress,
    forceResetAllData
  } = useStudentProgress();
  
  // Dashboard progress tracking
  const { updateProgress: updateDashboardProgress } = useProgress();
  
  // State for difficulty selection and UI
  const [selectedDifficulty, setSelectedDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [showProgress, setShowProgress] = useState(false);
  const [attemptStartTime, setAttemptStartTimeLocal] = useState<number>(0);
  const [availableWords, setAvailableWords] = useState<Word[]>([]);
  const [sentenceSlots, setSentenceSlots] = useState<(Word | null)[]>([]);
  const [draggedWord, setDraggedWord] = useState<Word | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  // Initialize current sentence if not set
  useEffect(() => {
    if (!currentSentence) {
      const initialSentence = getRandomSentence(selectedDifficulty);
      hookNextSentence(initialSentence);
    }
  }, [currentSentence, selectedDifficulty, hookNextSentence]);

  // Add this useEffect to show badge notifications:
  useEffect(() => {
    const newBadges = progress.badges.filter(badge => 
      !previousBadges.current.includes(badge)
    );
    
    newBadges.forEach(badge => {
      const getBadgeName = (badge: string) => {
        switch (badge) {
          case 'streak_5': return '5 Streak Master! 🔥';
          case 'streak_10': return '10 Streak Legend! ⚡';
          case 'completion_10': return '10 Sentences Completed! 🎯';
          case 'accuracy_90': return '90% Accuracy Expert! 🏆';
          default: return 'New Achievement! ⭐';
        }
      };
      
      toast({
        title: "🏆 New Achievement!",
        description: getBadgeName(badge),
        duration: 4000,
      });
    });
    
    previousBadges.current = progress.badges;
  }, [progress.badges, toast]);

  // Add this useEffect to notify about level changes:
  useEffect(() => {
    if (previousLevel.current && previousLevel.current !== progress.currentLevel) {
      const levelUpMessage = progress.currentLevel === 'intermediate' 
        ? "🎉 Leveled up to Medium! Sentences are getting more challenging!"
        : progress.currentLevel === 'advanced'
        ? "🚀 Amazing! You've reached Hard level! Expert sentences ahead!"
        : "📚 Back to easier sentences. Take your time!";
      
      toast({
        title: "Level Change!",
        description: levelUpMessage,
        duration: 3000,
      });
    }
    previousLevel.current = progress.currentLevel;
  }, [progress.currentLevel, toast]);

  // Add a ref to always point to the latest currentSentence
  const currentSentenceRef = useRef(currentSentence);
  useEffect(() => {
    currentSentenceRef.current = currentSentence;
  }, [currentSentence]);
  
  // Add a ref to lock the sentence at the start of listening
  const listeningSentenceRef = useRef(currentSentence);

  const { playSound } = useSoundEffects();
  
  // Session timer to track actual time spent
  const { seconds: sessionTime, getFormattedTime } = useSessionTimer();

  // Use Whisper instead of Web Speech API
  const { isListening, isSupported, startListening: origStartListening, stopListening } = useWhisperVoiceRecognition({
    onResult: (transcript) => {
      console.log('Whisper transcript:', transcript);
      processVoiceInput(transcript);
    },
    onError: (error) => {
      console.error('Whisper recognition error:', error);
      toast({
        title: "Voice Recognition Error",
        description: error,
        variant: "destructive"
      });
    }
  });

  // Wrap startListening to lock the sentence
  const startListening = async () => {
    await resumeAudioContext();
    setAttemptStartTime(Date.now()); // Start timing
    listeningSentenceRef.current = currentSentenceRef.current;
    origStartListening();
  };
  // Use the ref in processVoiceInput
  const processVoiceInput = async (transcript: string) => {
    setLastTranscript(transcript);
    
    const timeToComplete = (Date.now() - attemptStartTime) / 1000; // Convert to seconds
    const { accuracy, isCorrect } = recordAttempt(transcript, timeToComplete);
    
    // Update dashboard progress (for database)
    try {
      await updateDashboardProgress("sentence_builder", {
        total_attempts: 1,
        correct_answers: isCorrect ? 1 : 0,
        total_time_spent: Math.max(1, Math.floor(timeToComplete / 60)) // Convert to minutes
      });
    } catch (error) {
      console.error("Error updating dashboard progress:", error);
    }
    
    if (isCorrect) {
      playSound('correct');
      toast({
        title: "Perfect! 🎉",
        description: `${accuracy}% accuracy! ${getDifficultyMessage()}`,
      });
      
      setTimeout(() => {
        nextSentence();
      }, 2000);
    } else {
      playSound('incorrect');
      toast({
        title: `${accuracy}% Match`,
        description: `You said: "${transcript}". Try again!`,
        variant: "destructive"
      });
    }
  };

  const getDifficultyMessage = () => {
    switch (progress.currentLevel) {
      case 'beginner': return 'Keep it up! 🌟';
      case 'intermediate': return 'Getting challenging! 💪';
      case 'advanced': return 'Expert level! 👑';
      default: return 'Great job! 🎯';
    }
  };

  const initializeSentence = useCallback(() => {
    if (!currentSentence) {
      return; // Don't initialize if no sentence is available
    }
    
    // Shuffle the words and create word objects
    const shuffledWords = [...currentSentence.words]
      .sort(() => Math.random() - 0.5)
      .map((word, index) => ({
        id: `word-${index}`,
        text: word
      }));
    
    setAvailableWords(shuffledWords);
    setSentenceSlots(new Array(currentSentence.words.length).fill(null));
    setIsComplete(false);
    setShowHint(false);
    setLastTranscript("");
  }, [currentSentence]);

  // Initialize the current sentence
  useEffect(() => {
    initializeSentence();
  }, [initializeSentence]);

  const nextSentence = () => {
    // Get a new random sentence of the selected difficulty
    const newSentence = getRandomSentence(selectedDifficulty);
    hookNextSentence(newSentence);
    setScore(prev => prev + 1);
    setAttempts(0);
    setAttemptStartTimeLocal(Date.now());
  };

  const resetSentence = () => {
    initializeSentence();
    setAttempts(0);
  };

  const shuffleSentence = () => {
    const newSentence = getRandomSentence(selectedDifficulty);
    hookNextSentence(newSentence);
    setAttempts(0);
    setAttemptStartTimeLocal(Date.now());
    playSound('click');
    toast({
      title: "🔄 New Sentence!",
      description: "Try this new sentence!",
    });
  };

  const handleShowHint = () => {
    setShowHint(!showHint);
    playSound('click');
  };

  const speakSentence = () => {
    if (!currentSentence) return;
    
    const utterance = new SpeechSynthesisUtterance(currentSentence.correct);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
    playSound('click');
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const word = availableWords.find(w => w.id === draggableId) || 
                 sentenceSlots.find(w => w?.id === draggableId);

    if (!word) return;

    // Handle drag from available words to sentence slots
    if (source.droppableId === "available-words" && destination.droppableId === "sentence-slots") {
      const newAvailableWords = availableWords.filter(w => w.id !== draggableId);
      const newSentenceSlots = [...sentenceSlots];
      
      // If there's already a word in the destination slot, move it back to available words
      if (newSentenceSlots[destination.index]) {
        newAvailableWords.push(newSentenceSlots[destination.index]!);
      }
      
      newSentenceSlots[destination.index] = word;
      
      setAvailableWords(newAvailableWords);
      setSentenceSlots(newSentenceSlots);
      playSound('click');
      
      // Check if sentence is complete and correct
      checkSentenceCompletion(newSentenceSlots);
    }
    
    // Handle drag from sentence slots back to available words
    else if (source.droppableId === "sentence-slots" && destination.droppableId === "available-words") {
      const newSentenceSlots = [...sentenceSlots];
      newSentenceSlots[source.index] = null;
      const newAvailableWords = [...availableWords, word];
      
      setAvailableWords(newAvailableWords);
      setSentenceSlots(newSentenceSlots);
      playSound('click');
    }
    
    // Handle reordering within sentence slots
    else if (source.droppableId === "sentence-slots" && destination.droppableId === "sentence-slots") {
      const newSentenceSlots = [...sentenceSlots];
      const [removed] = newSentenceSlots.splice(source.index, 1);
      newSentenceSlots.splice(destination.index, 0, removed);
      
      setSentenceSlots(newSentenceSlots);
      playSound('click');
      
      checkSentenceCompletion(newSentenceSlots);
    }
  };

  const checkSentenceCompletion = (slots: (Word | null)[]) => {
    if (!currentSentence) return;
    
    // Check if all slots are filled
    if (slots.every(slot => slot !== null)) {
      const constructedSentence = slots.map(slot => slot!.text).join(' ');
      const isCorrect = constructedSentence === currentSentence.words.join(' ');
      
      if (isCorrect) {
        setIsComplete(true);
        playSound('correct');
        toast({
          title: "Excellent! 🎉",
          description: "You built the sentence correctly!",
        });
        
        // Update progress for drag-and-drop completion
        updateStudentProgress({
          sentenceId: currentSentence.id,
          difficulty: currentSentence.difficulty,
          isCorrect: true,
          attempts: attempts + 1,
          timeSpent: sessionTime
        });
        
        // Update dashboard progress (for database)
        updateDashboardProgress("sentence_builder", {
          total_attempts: 1,
          correct_answers: 1,
          total_time_spent: Math.max(1, Math.floor(sessionTime / 60)) // Convert to minutes
        }).catch(error => {
          console.error("Error updating dashboard progress:", error);
        });
        
        setTimeout(() => {
          nextSentence();
        }, 2000);
      } else {
        setAttempts(prev => prev + 1);
        playSound('incorrect');
        toast({
          title: "Not quite right",
          description: "Try rearranging the words.",
          variant: "destructive"
        });
      }
    }
  };

  if (!isSupported) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-red-600">Voice Recognition Not Available</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Whisper voice recognition requires an OpenAI API key. Please configure VITE_OPENAI_API_KEY in your environment variables.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Progress Dashboard */}
      {showProgress && (
        <ProgressDashboard 
          progress={{
            averageAccuracy: progress.averageAccuracy,
            currentStreak: progress.currentStreak,
            bestStreak: progress.bestStreak,
            averageSpeed: getProgressMetrics().speed,
            levelProgress: progress.levelProgress,
            currentLevel: progress.currentLevel,
            easyAccuracy: progress.levelProgress.easy.accuracy,
            mediumAccuracy: progress.levelProgress.medium.accuracy,
            hardAccuracy: progress.levelProgress.hard.accuracy,
            easyCompleted: progress.levelProgress.easy.completed,
            easyTotal: progress.levelProgress.easy.total,
            mediumCompleted: progress.levelProgress.medium.completed,
            mediumTotal: progress.levelProgress.medium.total,
            hardCompleted: progress.levelProgress.hard.completed,
            hardTotal: progress.levelProgress.hard.total,
            badges: progress.badges,
            completedSentences: progress.completedSentences
          }}
        />
      )}
      
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              Sentence Builder 
              <Badge variant={progress.currentLevel === 'beginner' ? 'default' : progress.currentLevel === 'intermediate' ? 'secondary' : 'destructive'}>
                {progress.currentLevel.toUpperCase()} LEVEL
              </Badge>
            </span>
            <div className="flex items-center gap-4">
              <Badge variant="outline">Score: {progress.correctAttempts}/{progress.totalAttempts}</Badge>
              <Badge variant="outline">🔥 {progress.currentStreak}</Badge>
            </div>
          </CardTitle>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Attempts: {attempts}</span>
            <span>Time: {getFormattedTime()}</span>
          </div>
          
          {/* Progress Metrics */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
            <span>Accuracy: {Math.round(getProgressMetrics().accuracy)}%</span>
            <span>Streak: {getProgressMetrics().streak}</span>
            <span>Completed: {getProgressMetrics().totalCompleted}</span>
          </div>
          
          {/* Difficulty Selection */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={selectedDifficulty === 'beginner' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedDifficulty('beginner');
                const newSentence = getRandomSentence('beginner');
                hookNextSentence(newSentence);
                setAttempts(0);
                setAttemptStartTimeLocal(Date.now());
              }}
            >
              Beginner
            </Button>
            <Button
              variant={selectedDifficulty === 'intermediate' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedDifficulty('intermediate');
                const newSentence = getRandomSentence('intermediate');
                hookNextSentence(newSentence);
                setAttempts(0);
                setAttemptStartTimeLocal(Date.now());
              }}
            >
              Intermediate
            </Button>
            <Button
              variant={selectedDifficulty === 'advanced' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedDifficulty('advanced');
                const newSentence = getRandomSentence('advanced');
                hookNextSentence(newSentence);
                setAttempts(0);
                setAttemptStartTimeLocal(Date.now());
              }}
            >
              Advanced
            </Button>
          </div>
          
          {/* Current Sentence Info */}
          {currentSentence && (
            <div className="mt-2 text-sm text-gray-600">
              <span>Category: {currentSentence.category}</span>
              {currentSentence.grammar_focus && (
                <span className="ml-4">Focus: {currentSentence.grammar_focus}</span>
              )}
              {isSentenceCompleted(currentSentence.id) && (
                <Badge variant="secondary" className="ml-2">Completed</Badge>
              )}
            </div>
          )}
          
          {/* Progress Toggle and Reset */}
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => setShowProgress(!showProgress)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              {showProgress ? "Hide Progress" : "View Progress"}
            </Button>
            <Button
              onClick={() => {
                forceResetAllData();
                toast({
                  title: "🔄 Progress Reset",
                  description: "All progress data has been cleared!",
                });
              }}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset All Progress
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Voice Recognition Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Recognition (Powered by Whisper)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={isListening ? stopListening : startListening}
              variant={isListening ? "destructive" : "default"}
              className="flex items-center gap-2"
              disabled={!isSupported}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isListening ? "Stop Listening" : "Start Speaking"}
            </Button>
            
            <Button
              onClick={speakSentence}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Volume2 className="h-4 w-4" />
              Hear Sentence
            </Button>
          </div>
          
          {isListening && currentSentence && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-medium">🎤 Listening... Speak the correct sentence!</p>
            </div>
          )}
          
          {lastTranscript && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Last spoken:</p>
              <p className="text-gray-900">"{lastTranscript}"</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drag and Drop Section */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Build the Sentence</span>
              <div className="flex gap-2">
                <Button
                  onClick={handleShowHint}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Lightbulb className="h-4 w-4" />
                  {showHint ? 'Hide' : 'Show'} Hint
                </Button>
                <Button
                  onClick={shuffleSentence}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Shuffle className="h-4 w-4" />
                  New Sentence
                </Button>
                <Button
                  onClick={resetSentence}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </CardTitle>
            {showHint && (
              <Alert className="bg-blue-50 border-blue-200">
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <strong>Hint:</strong> {currentSentence?.hint || "Think about the word order!"}
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sentence Slots */}
            <div>
              <h3 className="text-sm font-medium mb-3">Drag words here to build the sentence:</h3>
              <Droppable droppableId="sentence-slots" direction="horizontal">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg min-h-[60px] items-center"
                  >
                    {sentenceSlots.map((slot, index) => (
                      <div key={index} className="flex items-center">
                        {slot ? (
                          <Draggable draggableId={slot.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`px-3 py-2 bg-blue-100 border border-blue-300 rounded-lg font-medium cursor-move ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                              >
                                {slot.text}
                              </div>
                            )}
                          </Draggable>
                        ) : (
                          <div className="w-20 h-10 border-2 border-gray-200 rounded-lg bg-gray-50" />
                        )}
                      </div>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Available Words */}
            <div>
              <h3 className="text-sm font-medium mb-3">Available words:</h3>
              <Droppable droppableId="available-words" direction="horizontal">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex gap-2 flex-wrap p-4 border border-gray-300 rounded-lg min-h-[60px]"
                  >
                    {availableWords.map((word, index) => (
                      <Draggable key={word.id} draggableId={word.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`px-3 py-2 bg-green-100 border border-green-300 rounded-lg font-medium cursor-move ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            {word.text}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </CardContent>
        </Card>
      </DragDropContext>

      {/* Session Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Session Progress</span>
              <span>{score} sentences completed this session</span>
            </div>
            <Progress value={score > 0 ? Math.min((score / 10) * 100, 100) : 0} />
            <div className="text-xs text-gray-500">
              {score}/10 sentences this session
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SentenceBuilderWithWhisper;