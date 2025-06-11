
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CorrectionResult {
  originalSentence: string;
  correctedSentence: string;
  explanation: string;
  hasErrors: boolean;
}

const GrammarCorrector = () => {
  const [sentence, setSentence] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const { toast } = useToast();

  const correctGrammar = async () => {
    if (!sentence.trim()) {
      toast({
        title: "Please enter a sentence",
        description: "Type a sentence that you'd like me to check!",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/correct-grammar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sentence: sentence.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to correct grammar');
      }

      const data = await response.json();
      setResult(data);
      
      if (!data.hasErrors) {
        toast({
          title: "Great job! 🎉",
          description: "Your sentence is already correct!",
        });
      }
    } catch (error) {
      console.error('Error correcting grammar:', error);
      toast({
        title: "Oops! Something went wrong",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      correctGrammar();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">✍️</span>
            Grammar Helper
          </CardTitle>
          <CardDescription>
            Type a sentence and I'll help you make it perfect! Press Ctrl+Enter to check quickly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sentence">Your Sentence</Label>
            <Textarea
              id="sentence"
              placeholder="Write your sentence here... For example: 'Me and my friend goes to school everyday.'"
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              onKeyDown={handleKeyPress}
              className="min-h-[100px] text-base"
            />
          </div>
          
          <Button 
            onClick={correctGrammar} 
            disabled={isLoading || !sentence.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking your grammar...
              </>
            ) : (
              'Check My Grammar'
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className={result.hasErrors ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.hasErrors ? (
                <>
                  <XCircle className="h-5 w-5 text-orange-600" />
                  <span className="text-orange-800">Let's Fix This Together!</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800">Perfect Grammar!</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">What you wrote:</Label>
                <p className="text-base p-3 bg-white rounded border border-gray-200 mt-1">
                  {result.originalSentence}
                </p>
              </div>
              
              {result.hasErrors && (
                <div>
                  <Label className="text-sm font-medium text-green-700">Corrected version:</Label>
                  <p className="text-base p-3 bg-green-100 rounded border border-green-200 mt-1 font-medium">
                    {result.correctedSentence}
                  </p>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium text-blue-700">
                  {result.hasErrors ? "Why this helps:" : "What makes it great:"}
                </Label>
                <p className="text-base p-3 bg-blue-50 rounded border border-blue-200 mt-1">
                  {result.explanation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GrammarCorrector;
