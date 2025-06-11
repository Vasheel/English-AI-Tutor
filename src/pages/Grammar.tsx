
import NavBar from "@/components/NavBar";
import GrammarCorrector from "@/components/GrammarCorrector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Grammar = () => {
  const tips = [
    "Read your sentence out loud to hear if it sounds right.",
    "Check if your subject and verb agree (he goes, they go).",
    "Remember: 'I' comes after other people in a sentence.",
    "Every sentence needs a subject (who) and a verb (what they do).",
    "Use commas to separate items in a list."
  ];

  return (
    <div className="min-h-screen bg-edu-bg">
      <NavBar />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">English Grammar Helper</h1>
        <p className="text-gray-600 mb-8">
          Practice your writing skills with our AI grammar assistant.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <GrammarCorrector />
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Grammar Tips</CardTitle>
                <CardDescription>
                  Quick reminders to help you write better
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="mt-1 bg-edu-purple text-white w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs">{index + 1}</span>
                      </div>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-edu-light-purple bg-opacity-20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🌟</span>
                  <span>Writing Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-5xl font-bold text-edu-purple mb-2">12</div>
                  <p className="text-gray-600">Sentences corrected today</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Grammar;
