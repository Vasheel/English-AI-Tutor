// src/hooks/useWhisperVoiceRecognition.ts
import React, { useState, useCallback, useRef } from 'react';

interface WhisperVoiceRecognitionOptions {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  language?: string;
}

export const useWhisperVoiceRecognition = ({
  onResult,
  onError,
  language = 'en'
}: WhisperVoiceRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if we have OpenAI API key
  const hasAPIKey = Boolean(import.meta.env.VITE_OPENAI_API_KEY);

  const processAudioWithWhisper = useCallback(async () => {
    try {
      if (audioChunksRef.current.length === 0) {
        onError?.('No audio data recorded. Please try again.');
        return;
      }

      // Create audio blob from chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Check if blob has content
      if (audioBlob.size === 0) {
        onError?.('No audio data captured. Please try speaking again.');
        return;
      }

      // Get API key for the request
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

      if (!apiKey) {
        onError?.('OpenAI API key not found. Please check your environment configuration.');
        return;
      }

      // Create form data for Whisper API
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', language);
      formData.append('response_format', 'text');

      // Call OpenAI Whisper API
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 401) {
          throw new Error('Invalid OpenAI API key. Please check your VITE_OPENAI_API_KEY.');
        } else if (response.status === 400) {
          throw new Error('Audio format not supported. Please try again.');
        } else {
          throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
        }
      }

      const transcript = await response.text();
      
      if (transcript && transcript.trim()) {
        onResult(transcript.trim());
      } else {
        onError?.('No speech detected. Please try speaking more clearly.');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process audio. Please try again.';
      onError?.(errorMessage);
    }
  }, [language, onResult, onError]);

  const startListening = useCallback(async () => {
    if (!hasAPIKey) {
      onError?.('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your environment.');
      return;
    }

    if (isListening) return;

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 16000 }
        } 
      });

      streamRef.current = stream;

      // Clear previous audio chunks
      audioChunksRef.current = [];

      // Check for supported MIME types
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/mpeg'
      ];

      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error('No supported audio format found');
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Process the recorded audio
        if (audioChunksRef.current.length > 0) {
          await processAudioWithWhisper();
        } else {
          onError?.('No audio data recorded. Please try again.');
        }
        
        setIsListening(false);
      };

      mediaRecorder.onerror = (event) => {
        onError?.('Recording error occurred. Please try again.');
        setIsListening(false);
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsListening(true);

    } catch (error) {
      // Cleanup on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Could not access microphone';
      
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        onError?.('Microphone access denied. Please allow microphone permissions and try again.');
      } else {
        onError?.(errorMessage);
      }
      
      setIsListening(false);
    }
  }, [isListening, hasAPIKey, onError, processAudioWithWhisper]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && isListening) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
    
    // Also stop stream tracks immediately
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [isListening]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    isListening,
    isSupported: hasAPIKey && 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    startListening,
    stopListening
  };
};