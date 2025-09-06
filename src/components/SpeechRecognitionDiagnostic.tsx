// Speech Recognition Diagnostic Component
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Mic, MicOff, Settings, Shield } from 'lucide-react';

type Severity = 'HIGH' | 'MEDIUM' | 'LOW' | string;

interface Issue {
  type: string;
  severity: Severity;
  message: string;
  fix: string;
}

interface DiagnosticResults {
  timestamp: string;
  issues: Issue[];
  recommendations: string[];
  activeRecognitions: string[];
  browserInfo: Record<string, string | number | boolean | undefined>;
}

export const SpeechRecognitionDiagnostic: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResults>({
    timestamp: '',
    issues: [],
    recommendations: [],
    activeRecognitions: [],
    browserInfo: {}
  });
  const [isScanning, setIsScanning] = useState(false);

  const runDiagnostics = () => {
    setIsScanning(true);
    
    const results: DiagnosticResults = {
      timestamp: new Date().toLocaleTimeString(),
      issues: [],
      recommendations: [],
      activeRecognitions: [],
      browserInfo: {}
    };

    // Check for multiple recognition instances
    const checkActiveRecognitions = () => {
      // This is a tricky one - we need to check the global scope
      let recognitionCount = 0;
      
      // Check window object for recognition instances
      Object.keys(window).forEach(key => {
        if (key.includes('recognition') || key.includes('speech')) {
          recognitionCount++;
          results.activeRecognitions.push(key);
        }
      });

      if (recognitionCount > 1) {
        results.issues.push({
          type: 'MULTIPLE_INSTANCES',
          severity: 'HIGH',
          message: `Found ${recognitionCount} potential speech recognition instances`,
          fix: 'Ensure only one recognition instance is active at a time'
        });
      }
    };

    // Check for continuous listening
    const checkContinuousListening = () => {
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        results.issues.push({
          type: 'SPEECH_SYNTHESIS_ACTIVE',
          severity: 'MEDIUM',
          message: 'Speech synthesis is currently active',
          fix: 'This might interfere with speech recognition'
        });
      }
    };

    // Check browser permissions
    const checkPermissions = async () => {
      try {
        if ('permissions' in navigator) {
          const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          results.browserInfo.microphonePermission = micPermission.state;
          
          if (micPermission.state === 'granted') {
            results.recommendations.push('✅ Microphone permission granted');
          } else if (micPermission.state === 'prompt') {
            results.issues.push({
              type: 'PERMISSION_PROMPT',
              severity: 'MEDIUM',
              message: 'Microphone permission not yet granted',
              fix: 'User will be prompted when speech recognition starts'
            });
          } else {
            results.issues.push({
              type: 'PERMISSION_DENIED',
              severity: 'HIGH',
              message: 'Microphone permission denied',
              fix: 'User must manually enable microphone in browser settings'
            });
          }
        }
      } catch (error) {
        results.issues.push({
          type: 'PERMISSION_CHECK_FAILED',
          severity: 'LOW',
          message: 'Could not check microphone permissions',
          fix: 'This is normal on some browsers'
        });
      }
    };

    // Check for Web Speech API support
    const checkWebSpeechSupport = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        results.issues.push({
          type: 'NO_SPEECH_SUPPORT',
          severity: 'HIGH',
          message: 'Web Speech API not supported in this browser',
          fix: 'Use Chrome, Edge, or Safari for best speech recognition support'
        });
      } else {
        results.recommendations.push('✅ Web Speech API supported');
      }

      // Check if we can create an instance
      try {
        const testRecognition = new SpeechRecognition();
        results.browserInfo.canCreateRecognition = true;
        
        // Check default settings
        results.browserInfo.defaultContinuous = testRecognition.continuous;
        results.browserInfo.defaultInterimResults = testRecognition.interimResults;
        
        if (testRecognition.continuous === true) {
          results.issues.push({
            type: 'DEFAULT_CONTINUOUS_TRUE',
            severity: 'HIGH',
            message: 'Speech recognition defaults to continuous=true',
            fix: 'Always explicitly set continuous=false to prevent unwanted listening'
          });
        }
        
        // Clean up test instance
        testRecognition.abort();
      } catch (error) {
        results.issues.push({
          type: 'CANNOT_CREATE_RECOGNITION',
          severity: 'HIGH',
          message: 'Cannot create speech recognition instance',
          fix: 'Check browser compatibility and permissions'
        });
      }
    };

    // Check for common problematic patterns
    const checkCommonPatterns = () => {
      // Check if recognition is set to restart on end
      const scripts = document.querySelectorAll('script');
      let hasAutoRestart = false;
      
      scripts.forEach(script => {
        if (script.textContent?.includes('recognition.start()') && 
            script.textContent?.includes('onend')) {
          hasAutoRestart = true;
        }
      });

      if (hasAutoRestart) {
        results.issues.push({
          type: 'AUTO_RESTART_DETECTED',
          severity: 'HIGH',
          message: 'Code pattern suggests auto-restarting recognition',
          fix: 'Remove automatic restart in onend handler'
        });
      }

      // Check for global event listeners
      const hasGlobalListeners = document.addEventListener.toString().includes('speech') ||
                                document.addEventListener.toString().includes('recognition');
      
      if (hasGlobalListeners) {
        results.recommendations.push('⚠️ Global speech event listeners detected - review for necessity');
      }
    };

    // Run all checks
    checkActiveRecognitions();
    checkContinuousListening();
    checkWebSpeechSupport();
    checkCommonPatterns();
    checkPermissions().then(() => {
      setDiagnostics(results);
      setIsScanning(false);
    });
  };

  // Auto-run diagnostics on mount
  useEffect(() => {
    runDiagnostics();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH': return '🚨';
      case 'MEDIUM': return '⚠️';
      case 'LOW': return 'ℹ️';
      default: return '📋';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Speech Recognition Diagnostics</h2>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={runDiagnostics}
            disabled={isScanning}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {isScanning ? 'Scanning...' : 'Run Diagnostics'}
          </button>
          {diagnostics.timestamp && (
            <span className="text-sm text-gray-500">
              Last scan: {diagnostics.timestamp}
            </span>
          )}
        </div>
      </div>

      {diagnostics.issues && (
        <>
          {/* Issues Section */}
          {diagnostics.issues.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Issues Found ({diagnostics.issues.length})
              </h3>
              <div className="space-y-3">
                {diagnostics.issues.map((issue: Issue, index: number) => (
                  <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{getSeverityIcon(issue.severity)}</span>
                      <div className="flex-1">
                        <div className="font-medium mb-1">
                          {issue.type.replace(/_/g, ' ')} ({issue.severity})
                        </div>
                        <div className="text-sm mb-2">{issue.message}</div>
                        <div className="text-sm font-medium">
                          <strong>Fix:</strong> {issue.fix}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations Section */}
          {diagnostics.recommendations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-green-600 mb-3">
                ✅ Recommendations
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <ul className="space-y-1">
                  {diagnostics.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-green-700">{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Browser Info Section */}
          {Object.keys(diagnostics.browserInfo).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-600 mb-3">
                📊 Browser Information
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {Object.entries(diagnostics.browserInfo).map(([key, value]: [string, string | number | boolean | undefined]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Fixes Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">🔧 Quick Fixes for Unwanted Listening</h3>
            <div className="space-y-3 text-sm">
              <div className="bg-white p-3 rounded border">
                <strong>1. Set continuous = false:</strong>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
recognition.continuous = false; // Prevents constant listening
                </pre>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <strong>2. Always stop after result:</strong>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">{`
recognition.onresult = (event) => {
  // Handle result
  recognition.stop(); // Important: Always stop
};
`}</pre>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <strong>3. Don't auto-restart in onend:</strong>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">{`
recognition.onend = () => {
  // DON'T do: recognition.start();
  setIsListening(false);
};
`}</pre>
              </div>

              <div className="bg-white p-3 rounded border">
                <strong>4. Use manual start only:</strong>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">{`
// Only start when user clicks button
const startListening = () => recognition.start();
`}</pre>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};