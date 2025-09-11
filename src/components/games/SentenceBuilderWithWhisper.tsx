// src/components/games/SentenceBuilderWithWhisper.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { CheckCircle, XCircle, Mic, MicOff, RotateCcw, Lightbulb, Volume2 } from 'lucide-react';
import { useWhisperVoiceRecognition } from '@/hooks/useWhisperVoiceRecognition';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import { useToast } from '@/hooks/use-toast';
import { resumeAudioContext } from '@/utils/audioContext';

interface Word {
  id: string;
  text: string;
}

interface Sentence {
  words: string[];
  correct: string;
}

const SentenceBuilderWithWhisper: React.FC = () => {
  const { toast } = useToast();
  
  const sentences: Sentence[] = [
    { 
      words: ["The", "cat", "is", "sleeping"],
      correct: "The cat is sleeping."
    },
    { 
      words: ["Birds", "fly", "in", "the", "sky"],
      correct: "Birds fly in the sky."
    },
    { 
      words: ["I", "like", "to", "read", "books"],
      correct: "I like to read books."
    },
    { 
      words: ["She", "plays", "with", "her", "dog"],
      correct: "She plays with her dog."
    },
    { 
      words: ["We", "go", "to", "school", "every", "day"],
      correct: "We go to school every day."
    }
  ];

  const [currentSentence, setCurrentSentence] = useState(sentences[0]);
  const [availableWords, setAvailableWords] = useState<Word[]>([]);
  const [sentenceSlots, setSentenceSlots] = useState<(Word | null)[]>([]);
  const [draggedWord, setDraggedWord] = useState<Word | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
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
    // Resume audio context before starting
    await resumeAudioContext();
    
    listeningSentenceRef.current = currentSentenceRef.current;
    origStartListening();
  };
  // Use the ref in processVoiceInput
  const processVoiceInput = (transcript: string) => {
    setLastTranscript(transcript); // Show transcript to user
    
    // Clean up the transcript
    const cleanTranscript = transcript.toLowerCase().trim();
    
    // Remove punctuation for comparison
    const cleanSpoken = cleanTranscript.replace(/[.,!?;:]/g, '');
    
    // Use the locked sentence from ref
    const sentence = listeningSentenceRef.current;
    const cleanCorrect = sentence.correct.toLowerCase().replace(/[.,!?;:]/g, '');
    
    console.log('Comparing:', cleanSpoken, 'vs', cleanCorrect);
    
    if (cleanSpoken === cleanCorrect) {
      playSound('correct');
      toast({
        title: "Perfect! 🎉",
        description: "You spoke the sentence correctly!",
      });
      
      // Auto-advance to next sentence
      setTimeout(() => {
        nextSentence();
      }, 2000);
    } else {
      playSound('incorrect');
      setAttempts(prev => prev + 1);
      toast({
        title: "Try Again",
        description: `You said: "${transcript}". Try speaking the correct sentence.`,
        variant: "destructive"
      });
    }
  };

  const initializeSentence = useCallback(() => {
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
    const currentIndex = sentences.indexOf(currentSentence);
    const nextIndex = (currentIndex + 1) % sentences.length;
    setCurrentSentence(sentences[nextIndex]);
    setScore(prev => prev + 1);
    setAttempts(0);
  };

  const resetSentence = () => {
    initializeSentence();
    setAttempts(0);
  };

  const handleShowHint = () => {
    setShowHint(!showHint);
    playSound('click');
  };

  const speakSentence = () => {
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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sentence Builder (Whisper Voice Recognition)</span>
            <Badge variant="outline">Score: {score}</Badge>
          </CardTitle>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Attempts: {attempts}</span>
            <span>Time: {getFormattedTime()}</span>
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
          
          {isListening && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-medium">🎤 Listening... Speak the correct sentence!</p>
              <p className="text-sm text-blue-600 mt-1">
                Target: "{currentSentence.correct}"
              </p>
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
              <Alert>
                <AlertDescription>
                  Correct sentence: "{currentSentence.correct}"
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

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{score} sentences completed</span>
            </div>
            <Progress value={(score / sentences.length) * 100} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SentenceBuilderWithWhisper;