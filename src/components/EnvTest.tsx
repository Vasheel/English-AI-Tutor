import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Copy } from 'lucide-react';

const EnvTest = () => {
  const [testResults, setTestResults] = React.useState(null);
  const [testing, setTesting] = React.useState(false);

  // Get environment variables
  const envVars = {
    VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_CHAT_MODEL: import.meta.env.VITE_CHAT_MODEL
  };

  const testAPIKey = async () => {
    setTesting(true);
    const apiKey = envVars.VITE_OPENAI_API_KEY;
    
    console.log('🧪 Testing API key from environment...');
    console.log('🧪 API Key present:', Boolean(apiKey));
    console.log('🧪 API Key length:', apiKey?.length || 0);
    console.log('🧪 API Key starts with sk-:', apiKey?.startsWith('sk-'));
    
    if (!apiKey) {
      setTestResults({
        success: false,
        error: 'No API key found in environment variables'
      });
      setTesting(false);
      return;
    }

    try {
      console.log('🧪 Making test request to OpenAI...');
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🧪 Response status:', response.status);
      console.log('🧪 Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        setTestResults({
          success: true,
          modelsCount: data.data?.length || 0,
          hasWhisper: data.data?.some(m => m.id.includes('whisper')) || false
        });
      } else {
        const errorText = await response.text();
        console.error('🧪 Error response:', errorText);
        setTestResults({
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          status: response.status
        });
      }
    } catch (error) {
      console.error('🧪 Network error:', error);
      setTestResults({
        success: false,
        error: `Network error: ${error.message}`
      });
    }
    
    setTesting(false);
  };

  const copyEnvFormat = () => {
    const envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value || 'NOT_SET'}`)
      .join('\n');
    
    navigator.clipboard.writeText(envContent);
    alert('Environment variables copied to clipboard!');
  };

  const maskValue = (value) => {
    if (!value) return 'NOT SET';
    if (value.length < 8) return value;
    return value.substring(0, 7) + '...' + value.substring(value.length - 4);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-2">
                  {value ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-mono text-sm">{key}</span>
                </div>
                <span className="text-sm text-gray-600">{maskValue(value)}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={testAPIKey} disabled={testing || !envVars.VITE_OPENAI_API_KEY}>
              {testing ? 'Testing...' : 'Test API Key'}
            </Button>
            <Button variant="outline" onClick={copyEnvFormat}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Env Vars
            </Button>
          </div>

          {testResults && (
            <Alert className={testResults.success ? 'border-green-200' : 'border-red-200'}>
              <AlertDescription>
                {testResults.success ? (
                  <div>
                    <p className="font-medium text-green-700">✅ API Key Working!</p>
                    <p>Models available: {testResults.modelsCount}</p>
                    <p>Whisper available: {testResults.hasWhisper ? 'Yes' : 'No'}</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-red-700">❌ API Key Failed</p>
                    <p>{testResults.error}</p>
                    {testResults.status && <p>Status: {testResults.status}</p>}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Debug Info:</strong></p>
            <p>• Environment mode: {import.meta.env.MODE}</p>
            <p>• Dev mode: {import.meta.env.DEV ? 'Yes' : 'No'}</p>
            <p>• Base URL: {import.meta.env.BASE_URL}</p>
            <p>• All env keys: {Object.keys(import.meta.env).join(', ')}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. If VITE_OPENAI_API_KEY shows "NOT SET":</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Check your .env file is in the project root</li>
              <li>• Verify the format: VITE_OPENAI_API_KEY=sk-your-key (no spaces, no quotes)</li>
              <li>• Restart your development server completely</li>
              <li>• Clear browser cache and reload</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">2. If API key shows but test fails:</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Check the API key is correct in OpenAI dashboard</li>
              <li>• Verify billing/usage limits aren't exceeded</li>
              <li>• Try generating a new API key</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">3. Check your .env file format:</h4>
            <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs">
              VITE_OPENAI_API_KEY=sk-your-actual-key<br/>
              VITE_SUPABASE_URL=your-supabase-url<br/>
              VITE_SUPABASE_ANON_KEY=your-supabase-key<br/>
              VITE_CHAT_MODEL=gpt-4o-mini
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnvTest;