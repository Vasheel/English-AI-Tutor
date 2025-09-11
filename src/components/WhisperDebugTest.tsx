import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff } from 'lucide-react';

const WhisperDebugTest = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [apiKeyTest, setApiKeyTest] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Test 1: Check if API key works for chat completions (like grammar tool)
  const testChatAPI = async () => {
    console.log('🧪 Testing Chat API (like grammar tool)...');
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Say "test successful"' }],
          max_tokens: 10
        })
      });

      console.log('🧪 Chat API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        setApiKeyTest({
          chat: { success: true, response: data.choices[0].message.content }
        });
      } else {
        const errorText = await response.text();
        setApiKeyTest({
          chat: { success: false, error: `${response.status}: ${errorText}` }
        });
      }
    } catch (error) {
      setApiKeyTest({
        chat: { success: false, error: error.message }
      });
    }
  };

  // Test 2: Test Whisper API with a simple audio file
  const testWhisperWithDummyAudio = async () => {
    console.log('🧪 Testing Whisper API with dummy audio...');
    
    try {
      // Create a minimal valid audio file (silent WAV)
      const sampleRate = 16000;
      const duration = 1; // 1 second
      const numChannels = 1;
      const numSamples = sampleRate * duration;
      const arrayBuffer = new ArrayBuffer(44 + numSamples * 2);
      const view = new DataView(arrayBuffer);
      
      // WAV header
      const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + numSamples * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, numSamples * 2, true);
      
      // Silent audio data (all zeros)
      for (let i = 0; i < numSamples; i++) {
        view.setInt16(44 + i * 2, 0, true);
      }
      
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/wav' });
      console.log('🧪 Created test audio blob, size:', audioBlob.size);
      
      const formData = new FormData();
      formData.append('file', audioBlob, 'test.wav');
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: formData
      });
      
      console.log('🧪 Whisper API Response status:', response.status);
      console.log('🧪 Whisper API Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const transcript = await response.text();
        setApiKeyTest(prev => ({
          ...prev,
          whisper: { success: true, transcript: transcript || '(silent audio - no transcript)' }
        }));
      } else {
        const errorText = await response.text();
        console.error('🧪 Whisper API Error:', errorText);
        setApiKeyTest(prev => ({
          ...prev,
          whisper: { success: false, error: `${response.status}: ${errorText}` }
        }));
      }
    } catch (error) {
      console.error('🧪 Whisper test error:', error);
      setApiKeyTest(prev => ({
        ...prev,
        whisper: { success: false, error: error.message }
      }));
    }
  };

  // Test 3: Record real audio and send to Whisper
  const startRecording = async () => {
    try {
      console.log('🎤 Starting real audio recording...');
      setError('');
      setResult('');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: { ideal: 16000 },
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      audioChunksRef.current = [];
      
      // Try different MIME types
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log('🎤 Using MIME type:', mimeType);
          break;
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        console.log('🎤 Audio chunk received, size:', event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🎤 Recording stopped, processing...');
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunksRef.current.length === 0) {
          setError('No audio data recorded');
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType });
        console.log('🎤 Final audio blob size:', audioBlob.size);
        console.log('🎤 Final audio blob type:', audioBlob.type);
        
        // Send to Whisper
        await sendToWhisper(audioBlob);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      
    } catch (error) {
      console.error('🎤 Recording error:', error);
      setError('Failed to start recording: ' + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('🎤 Stopping recording...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendToWhisper = async (audioBlob) => {
    try {
      console.log('🎤 Sending to Whisper API...');
      console.log('🎤 Blob size:', audioBlob.size);
      console.log('🎤 Blob type:', audioBlob.type);
      
      const formData = new FormData();
      formData.append('file', audioBlob, `recording.${audioBlob.type.includes('webm') ? 'webm' : 'wav'}`);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      formData.append('response_format', 'text');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: formData
      });

      console.log('🎤 Whisper response status:', response.status);
      console.log('🎤 Whisper response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const transcript = await response.text();
        console.log('🎤 Whisper transcript:', transcript);
        setResult(transcript || '(No speech detected)');
      } else {
        const errorText = await response.text();
        console.error('🎤 Whisper error:', errorText);
        setError(`Whisper API Error ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('🎤 Send to Whisper error:', error);
      setError('Failed to send to Whisper: ' + error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Whisper API Debug Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Step 1: Test API Key with Chat (like grammar tool)</h3>
            <Button onClick={testChatAPI}>Test Chat API</Button>
            {apiKeyTest?.chat && (
              <Alert className={apiKeyTest.chat.success ? 'border-green-200' : 'border-red-200'}>
                <AlertDescription>
                  {apiKeyTest.chat.success ? (
                    <span className="text-green-700">✅ Chat API working: {apiKeyTest.chat.response}</span>
                  ) : (
                    <span className="text-red-700">❌ Chat API failed: {apiKeyTest.chat.error}</span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Step 2: Test Whisper API with dummy audio</h3>
            <Button onClick={testWhisperWithDummyAudio}>Test Whisper API</Button>
            {apiKeyTest?.whisper && (
              <Alert className={apiKeyTest.whisper.success ? 'border-green-200' : 'border-red-200'}>
                <AlertDescription>
                  {apiKeyTest.whisper.success ? (
                    <span className="text-green-700">✅ Whisper API working: {apiKeyTest.whisper.transcript}</span>
                  ) : (
                    <span className="text-red-700">❌ Whisper API failed: {apiKeyTest.whisper.error}</span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Step 3: Test with real microphone recording</h3>
            <Button 
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "default"}
            >
              {isRecording ? (
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
            
            {isRecording && (
              <p className="text-blue-600">🎤 Recording... Speak something and then click Stop Recording</p>
            )}
          </div>

          {result && (
            <Alert className="border-green-200">
              <AlertDescription>
                <strong>Transcript:</strong> "{result}"
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-200">
              <AlertDescription>
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WhisperDebugTest;