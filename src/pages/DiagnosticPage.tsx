import React from 'react';
import { SpeechRecognitionDiagnostic } from '@/components/SpeechRecognitionDiagnostic';

const DiagnosticPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          🔍 Speech Recognition Health Check
        </h1>
        <SpeechRecognitionDiagnostic />
      </div>
    </div>
  );
};

export default DiagnosticPage;