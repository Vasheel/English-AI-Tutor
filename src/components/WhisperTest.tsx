// src/components/WhisperTest.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, CheckCircle, XCircle } from 'lucide-react';
import { useWhisperVoiceRecognition } from '@/hooks/useWhisperVoiceRecognition';

const WhisperTest: React.FC = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');

  const { isListening, isSupported, startListening, stopListening } = useWhisperVoiceRecognition({
    onResult: (result) => {
      setTranscript(result);
      setError('');
    },
    onError: (err) => {
      setError(err);
      setTranscript('');
    }
  });

  // Test API key validity
  React.useEffect(() => {
    const testAPIKey = async () => {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        setApiKeyStatus('invalid');
        return;
      }

      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });

        if (response.ok) {
          setApiKeyStatus('valid');
        } else {
          setApiKeyStatus('invalid');
        }
      } catch (error) {
        setApiKeyStatus('invalid');
      }
    };

    testAPIKey();
  }, []);

  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      alert('Microphone access: ✅ Working');
    } catch (error) {
      alert('Microphone access: ❌ Failed - ' + (error as Error).message);
    }
  };

  const clearResults = () => {
    setTranscript('');
    setError('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Whisper Voice Recognition Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Key Status */}
          <div className="flex items-center gap-2">
            <span className="font-medium">OpenAI API Key:</span>
            {apiKeyStatus === 'checking' && <span className="text-yellow-600">Checking...</span>}
            {apiKeyStatus === 'valid' && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                Valid
              </span>
            )}
            {apiKeyStatus === 'invalid' && (
              <span className="flex items-center gap-1 text-red-600">
                <XCircle className="h-4 w-4" />
                Invalid or Missing
              </span>
            )}
          </div>

          {/* Support Status */}
          <div className="flex items-center gap-2">
            <span className="font-medium">Voice Recognition:</span>
            {isSupported ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                Supported
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600">
                <XCircle className="h-4 w-4" />
                Not Supported
              </span>
            )}
          </div>

          {/* Test Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={isListening ? stopListening : startListening}
              variant={isListening ? "destructive" : "default"}
              disabled={!isSupported || apiKeyStatus !== 'valid'}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </>
              )}
            </Button>

            <Button onClick={testMicrophone} variant="outline">
              Test Microphone
            </Button>

            <Button onClick={clearResults} variant="outline">
              Clear Results
            </Button>
          </div>

          {/* Instructions */}
          {apiKeyStatus !== 'valid' && (
            <Alert>
              <AlertDescription>
                Please set your OpenAI API key in the VITE_OPENAI_API_KEY environment variable.
              </AlertDescription>
            </Alert>
          )}

          {isListening && (
            <Alert>
              <AlertDescription>
                🎤 Recording... Say something like "Hello world" or "The cat is sleeping"
              </AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {transcript && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">Transcript:</h3>
              <p className="text-green-900">"{transcript}"</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-medium text-red-800 mb-2">Error:</h3>
              <p className="text-red-900">{error}</p>
            </div>
          )}

          {/* Debug Info */}
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">Debug Information</summary>
            <div className="mt-2 space-y-1 text-gray-600">
              <div>API Key Present: {import.meta.env.VITE_OPENAI_API_KEY ? 'Yes' : 'No'}</div>
              <div>API Key Length: {import.meta.env.VITE_OPENAI_API_KEY?.length || 0}</div>
              <div>Browser: {navigator.userAgent}</div>
              <div>HTTPS: {location.protocol === 'https:' ? 'Yes' : 'No'}</div>
              <div>MediaDevices: {'mediaDevices' in navigator ? 'Supported' : 'Not Supported'}</div>
              <div>getUserMedia: {'getUserMedia' in (navigator.mediaDevices || {}) ? 'Supported' : 'Not Supported'}</div>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhisperTest;