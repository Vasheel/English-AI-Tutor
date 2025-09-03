import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// We no longer show the level badge or other metadata
import { Textarea } from '@/components/ui/textarea';

/**
 * GrammarImagePage
 *
 * This page displays an image prompt and allows the student to write a sentence
 * describing the image. It then calls the backend grammar API to evaluate
 * grammar, generate a corrected version, show a diff of changes, and a score.
 */
export default function GrammarImagePage() {
  // State to hold the list of image prompts loaded from the server
  const [images, setImages] = useState([]);
  // Index of the currently displayed image
  const [currentIndex, setCurrentIndex] = useState(0);
  // Text input by the student
  const [inputText, setInputText] = useState('');
  // Result returned from the API (corrected text, diff, explanations, score)
  const [result, setResult] = useState(null);
  // Loading state for API calls
  const [loading, setLoading] = useState(false);

  // Track whether the student passed both grammar and context checks
  const [passed, setPassed] = useState(true);
  // Hint to show when the sentence doesn't match the image context
  const [hint, setHint] = useState('');

  // Fetch list of images when component mounts
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch('/api/images/list');
        if (!res.ok) throw new Error('Failed to load images');
        const data = await res.json();
        setImages(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchImages();
  }, []);

  // Handler for submitting the sentence
  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setResult(null);
    setPassed(true);
    setHint('');
    try {
      const payload = {
        text: inputText,
        image_id: images[currentIndex]?.id || '',
        mode: 'minimal',
        dialect: 'en-US',
        grade_level: 6,
      };
      const res = await fetch('/api/grammar/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Evaluation failed');
      const data = await res.json();
      setResult(data);
      // Determine pass/fail based on context (if provided)
      if (data && data.context) {
        const contextPassed = data.context.passed;
        setPassed(contextPassed);
        if (!contextPassed && data.context.missing && data.context.missing.length > 0) {
          // Show the first missing tag as a hint
          setHint(data.context.missing[0]);
        }
      }
    } catch (error) {
      console.error(error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Show next image
  const nextImage = () => {
    if (images.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setInputText('');
    setResult(null);
    setPassed(true);
    setHint('');
  };
  // Previous and shuffle functions are unused now because we only provide a Next button

  const currentImage = images[currentIndex];

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Grammar Helper</CardTitle>
        </CardHeader>
        <CardContent>
          {currentImage ? (
            <div className="space-y-4">
              <div className="relative">
                {/* Display the image enlarged */}
                <img
                  src={currentImage.path}
                  alt={currentImage.alt || currentImage.id}
                  className="w-full rounded-md max-h-[500px] object-contain"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={nextImage} disabled={images.length === 0}>Next</Button>
              </div>
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Write a sentence describing what you see..."
                rows={3}
              />
              {!result && (
                <Button onClick={handleSubmit} disabled={loading || !inputText.trim()}>Evaluate My Writing</Button>
              )}
              {result && !passed && (
                <Button onClick={handleSubmit} disabled={loading}>Retry</Button>
              )}
              {loading && <p>Checking...</p>}
              {result && !result.error && (
                <div className="space-y-4">
              {/* Show the corrected sentence and context feedback */}
              <div className="space-y-4">
                <div className="border rounded-md p-3 bg-green-50">
                  <h3 className="font-semibold mb-1">Corrected Sentence:</h3>
                  <p className="bg-white p-2 rounded-md">
                    {result.corrected}
                  </p>
                </div>
                {/* If the description doesn't match the image, show a hint to include missing objects */}
                {result.context && !result.context.passed && (
                  <div className="border rounded-md p-3 bg-red-50">
                    <p className="text-red-700">Your description does not match the image.</p>
                    {hint && (
                      <p className="mt-2 text-sm"><span className="font-semibold">Try mentioning:</span> <span className="italic">{hint}</span></p>
                    )}
                  </div>
                )}
                {/* If there were changes, show them separately */}
                {result.diff && result.diff.length > 0 && (
                  <div className="border rounded-md p-3 bg-blue-50">
                    <h4 className="font-semibold mb-1">Changes:</h4>
                    <p className="font-mono whitespace-pre-line">
                      {result.diff.map((change: { value: string }) => change.value).join('')}
                    </p>
                  </div>
                )}
              </div>
                </div>
              )}
              {result && result.error && <p className="text-red-500">{result.error}</p>}
            </div>
          ) : (
            <p>Loading image prompts...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}