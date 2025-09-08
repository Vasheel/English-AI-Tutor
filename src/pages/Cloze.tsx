import NavBar from "@/components/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import ClozeTestComponent from "@/components/ClozeTestComponent";

type Difficulty = "beginner" | "intermediate" | "advanced";

type ClozeItem = {
  id: string;
  title: string;
  text: string; // Use ______ for blanks
  processedText?: string; // Optional: [BLANK] markers for review screens
  answers: string[]; // One-word answers in order
  difficulty: Difficulty;
  marks: number;
  topic: string;
  instructions?: string;
  wordBank?: string[]; // Optional
};

const CLOZE_TESTS: Record<Difficulty, ClozeItem[]> = {
  beginner: [
    {
      id: "beginner-1",
      title: "At the Park",
      text: "Ravi went to the ______ with his sister. They ______ a kite. The wind was ______ and the kite flew ______ in the sky. They ______ on the bench to rest and drank ______.",
      processedText: "Ravi went to the [BLANK] with his sister. They [BLANK] a kite. The wind was [BLANK] and the kite flew [BLANK] in the sky. They [BLANK] on the bench to rest and drank [BLANK].",
      answers: ["park", "flew", "strong", "high", "sat", "water"],
      difficulty: "beginner",
      marks: 6,
      topic: "Daily Life",
      instructions: "Write one suitable word in each blank space.",
    },
    {
      id: "beginner-2",
      title: "Morning Routine",
      text: "Every morning, I ______ up at six o'clock. I ______ my teeth and ______ a quick bath. Then I ______ breakfast with my family and ______ to school.",
      processedText: "Every morning, I [BLANK] up at six o'clock. I [BLANK] my teeth and [BLANK] a quick bath. Then I [BLANK] breakfast with my family and [BLANK] to school.",
      answers: ["wake", "brush", "take", "eat", "walk"],
      difficulty: "beginner",
      marks: 5,
      topic: "Routines",
    },
    {
      id: "beginner-3",
      title: "The Lost Puppy",
      text: "Mina found a ______ puppy near the gate. It looked ______ and hungry. She ______ it some milk and ______ a poster to find its ______.",
      processedText: "Mina found a [BLANK] puppy near the gate. It looked [BLANK] and hungry. She [BLANK] it some milk and [BLANK] a poster to find its [BLANK].",
      answers: ["small", "tired", "gave", "made", "owner"],
      difficulty: "beginner",
      marks: 5,
      topic: "Animals",
    },
    {
      id: "beginner-4",
      title: "School Trip",
      text: "Our class went on a ______ to the museum. We ______ many old tools and ______ about history. At noon we ______ our lunch in the garden and ______ photos together.",
      processedText: "Our class went on a [BLANK] to the museum. We [BLANK] many old tools and [BLANK] about history. At noon we [BLANK] our lunch in the garden and [BLANK] photos together.",
      answers: ["trip", "saw", "learned", "ate", "took"],
      difficulty: "beginner",
      marks: 5,
      topic: "School",
    },
    {
      id: "beginner-5",
      title: "The Garden",
      text: "My grandmother has a beautiful garden. She grows many ______ and vegetables. In spring, the roses ______ with lovely colors. She waters the plants every ______. Sometimes, butterflies come to ______ the garden. I help her pick the ripe ______ from the plants.",
      processedText: "My grandmother has a beautiful garden. She grows many [BLANK] and vegetables. In spring, the roses [BLANK] with lovely colors. She waters the plants every [BLANK]. Sometimes, butterflies come to [BLANK] the garden. I help her pick the ripe [BLANK] from the plants.",
      answers: ["flowers", "bloom", "day", "visit", "tomatoes"],
      difficulty: "beginner",
      marks: 5,
      topic: "Nature & Gardening",
    },
  ],
  intermediate: [
    {
      id: "intermediate-1",
      title: "The Elephant and the Ants",
      text: "The ants had a plan. They went straight into the ______ trunk. They ______ biting him. The elephant ______ in pain. He understood that small animals could be ______. He apologised ______ the ants.",
      processedText: "The ants had a plan. They went straight into the [BLANK] trunk. They [BLANK] biting him. The elephant [BLANK] in pain. He understood that small animals could be [BLANK]. He apologised [BLANK] the ants.",
      answers: ["elephant's", "started", "cried", "powerful", "to"],
      difficulty: "intermediate",
      marks: 5,
      topic: "Fables",
    },
    {
      id: "intermediate-2",
      title: "Science Fair",
      text: "Our class built a ______ volcano. When we added ______ and vinegar, it started ______. The crowd clapped because the experiment was ______.",
      processedText: "Our class built a [BLANK] volcano. When we added [BLANK] and vinegar, it started [BLANK]. The crowd clapped because the experiment was [BLANK].",
      answers: ["model", "baking", "erupting", "successful"],
      difficulty: "intermediate",
      marks: 4,
      topic: "Science",
    },
    {
      id: "intermediate-3",
      title: "Ocean Conservation",
      text: "Our oceans are facing serious ______ from pollution and overfishing. Plastic waste is particularly ______ to marine life. Many species are now ______ due to human activities. Scientists are working hard to find ______ to these problems. Everyone can help by ______ plastic use and supporting sustainable fishing. The future of our oceans ______ on our actions today.",
      processedText: "Our oceans are facing serious [BLANK] from pollution and overfishing. Plastic waste is particularly [BLANK] to marine life. Many species are now [BLANK] due to human activities. Scientists are working hard to find [BLANK] to these problems. Everyone can help by [BLANK] plastic use and supporting sustainable fishing. The future of our oceans [BLANK] on our actions today.",
      answers: ["threats", "harmful", "endangered", "solutions", "reducing", "depends"],
      difficulty: "intermediate",
      marks: 6,
      topic: "Environment",
    },
    {
      id: "intermediate-4",
      title: "Festival Day",
      text: "People gathered in the ______ to watch the parade. Drums ______ loudly while dancers ______ in bright costumes. Vendors ______ fresh snacks, and children ______ happily.",
      processedText: "People gathered in the [BLANK] to watch the parade. Drums [BLANK] loudly while dancers [BLANK] in bright costumes. Vendors [BLANK] fresh snacks, and children [BLANK] happily.",
      answers: ["street", "beat", "twirled", "sold", "cheered"],
      difficulty: "intermediate",
      marks: 5,
      topic: "Culture",
    },
    {
      id: "intermediate-5",
      title: "Healthy Habits",
      text: "To stay healthy, we should ______ regularly, eat a ______ diet, and get enough ______. Drinking water ______ the body and keeping a routine ______ good habits.",
      processedText: "To stay healthy, we should [BLANK] regularly, eat a [BLANK] diet, and get enough [BLANK]. Drinking water [BLANK] the body and keeping a routine [BLANK] good habits.",
      answers: ["exercise", "balanced", "sleep", "hydrates", "builds"],
      difficulty: "intermediate",
      marks: 5,
      topic: "Health",
    },
  ],
  advanced: [
    {
      id: "advanced-1",
      title: "The River Journey",
      text: "We paddled ______ the calm river at dawn. Mist ______ above the water and birds ______ in the reeds. By noon we ______ a shady spot where we ______ our lunch.",
      processedText: "We paddled [BLANK] the calm river at dawn. Mist [BLANK] above the water and birds [BLANK] in the reeds. By noon we [BLANK] a shady spot where we [BLANK] our lunch.",
      answers: ["along", "hung", "nested", "found", "shared"],
      difficulty: "advanced",
      marks: 5,
      topic: "Adventure",
    },
    {
      id: "advanced-2",
      title: "Team Spirit",
      text: "Although we ______ the first match, nobody gave ______. The captain ______ us to practise harder and to play as ______ team. In the finals, our effort ______ rewards.",
      processedText: "Although we [BLANK] the first match, nobody gave [BLANK]. The captain [BLANK] us to practise harder and to play as [BLANK] team. In the finals, our effort [BLANK] rewards.",
      answers: ["lost", "up", "urged", "a", "brought"],
      difficulty: "advanced",
      marks: 5,
      topic: "Character",
    },
    {
      id: "advanced-3",
      title: "Word Bank Challenge",
      text: "The museum ______ yesterday for a special exhibition. Visitors ______ long before the doors opened. Inside, they ______ rare maps that had been ______ for centuries.",
      processedText: "The museum [BLANK] yesterday for a special exhibition. Visitors [BLANK] long before the doors opened. Inside, they [BLANK] rare maps that had been [BLANK] for centuries.",
      answers: ["opened", "queued", "examined", "hidden"],
      difficulty: "advanced",
      marks: 4,
      topic: "History",
      wordBank: ["examined", "opened", "hidden", "queued", "arrived", "closed"],
    },
    {
      id: "advanced-4",
      title: "Climate Action",
      text: "Communities are ______ together to plant trees, ______ energy wisely, and ______ waste. These steps can ______ carbon emissions and ______ the harmful effects of climate change.",
      processedText: "Communities are [BLANK] together to plant trees, [BLANK] energy wisely, and [BLANK] waste. These steps can [BLANK] carbon emissions and [BLANK] the harmful effects of climate change.",
      answers: ["working", "using", "reducing", "lower", "mitigate"],
      difficulty: "advanced",
      marks: 5,
      topic: "Environment",
    },
    {
      id: "advanced-5",
      title: "STEM Club",
      text: "The robotics team ______ a prototype that could ______ objects and ______ obstacles. After several tests, they ______ the design and ______ it at the exhibition.",
      processedText: "The robotics team [BLANK] a prototype that could [BLANK] objects and [BLANK] obstacles. After several tests, they [BLANK] the design and [BLANK] it at the exhibition.",
      answers: ["built", "grip", "avoid", "refined", "presented"],
      difficulty: "advanced",
      marks: 5,
      topic: "STEM",
    },
  ],
};

const ClozePage = () => {
  const [level, setLevel] = useState<Difficulty>("beginner");
  const [active, setActive] = useState<ClozeItem | null>(null);

  const list = CLOZE_TESTS[level];

  return (
    <div className="min-h-screen bg-edu-bg">
      <NavBar />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-4 text-edu-dark">Cloze Test Practice</h1>
        <p className="text-gray-600 mb-6">Choose a level and practise PSAC‑style cloze passages. Each blank takes one suitable word.</p>

        <Tabs value={level} onValueChange={(v) => setLevel(v as Difficulty)} className="mb-6">
          <TabsList>
            <TabsTrigger value="beginner">Level 1 (Beginner)</TabsTrigger>
            <TabsTrigger value="intermediate">Level 2 (Intermediate)</TabsTrigger>
            <TabsTrigger value="advanced">Level 3 (Advanced)</TabsTrigger>
          </TabsList>
        </Tabs>

        {!active && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.instructions && (
                    <p className="text-sm text-gray-600">{item.instructions}</p>
                  )}
                  <div className="text-xs text-gray-500">Topic: {item.topic} • Marks: {item.marks}</div>
                  {item.wordBank && (
                    <div className="text-sm"><span className="font-semibold">Word Bank:</span> {item.wordBank.join(", ")}</div>
                  )}
                  <Button onClick={() => setActive(item)}>Start</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {active && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{active.title}</h2>
              <Button variant="outline" onClick={() => setActive(null)}>Back to list</Button>
            </div>
            {active.wordBank && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Word Bank</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700">{active.wordBank.join(", ")}</CardContent>
              </Card>
            )}
            <ClozeTestComponent
              text={active.text}
              answers={active.answers}
              onComplete={() => {}}
              onRestart={() => setActive(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ClozePage;


