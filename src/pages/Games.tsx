
import NavBar from "@/components/NavBar";
import WordScramble from "@/components/games/WordScramble";
import SentenceBuilder from "@/components/games/SentenceBuilder";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, Puzzle, Building, Trophy } from "lucide-react";

const Games = () => {
  return (
    <div className="min-h-screen bg-edu-bg">
      <NavBar />
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Gamepad2 className="h-8 w-8 text-purple-600" />
            Educational Games
          </h1>
          <p className="text-gray-600 mb-4">
            Learn English through fun and interactive games!
          </p>
        </div>

        <Tabs defaultValue="word-scramble" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="word-scramble" className="flex items-center gap-2">
              <Puzzle className="h-4 w-4" />
              Word Scramble
            </TabsTrigger>
            <TabsTrigger value="sentence-builder" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Sentence Builder
            </TabsTrigger>
          </TabsList>

          <TabsContent value="word-scramble">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <WordScramble />
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">How to Play</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>• Look at the scrambled letters</p>
                    <p>• Use the hint to help you</p>
                    <p>• Type the correct word</p>
                    <p>• Press Enter or click Check</p>
                    <p>• Try to get a high score!</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Benefits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>✓ Improves spelling</p>
                    <p>✓ Builds vocabulary</p>
                    <p>✓ Enhances pattern recognition</p>
                    <p>✓ Develops problem-solving skills</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sentence-builder">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SentenceBuilder />
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">How to Play</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>• Drag words from the bottom area</p>
                    <p>• Drop them in the correct order</p>
                    <p>• Build a complete sentence</p>
                    <p>• Click words to move them back</p>
                    <p>• Check your sentence!</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Benefits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>✓ Learns sentence structure</p>
                    <p>✓ Understands word order</p>
                    <p>✓ Improves grammar</p>
                    <p>✓ Builds confidence in writing</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Card className="mt-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardContent className="p-6 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Challenge Yourself!</h3>
            <p className="mb-4">
              Play these games regularly to improve your English skills. 
              Track your progress and earn achievements!
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <div className="bg-white/20 rounded-lg px-3 py-2">
                <div className="font-bold">Daily Goal</div>
                <div>Play 10 rounds</div>
              </div>
              <div className="bg-white/20 rounded-lg px-3 py-2">
                <div className="font-bold">Weekly Goal</div>
                <div>80% accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Games;
