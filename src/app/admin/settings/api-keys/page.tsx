
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../../../components/ui/card';
import { useToast } from '../../../../hooks/use-toast';
import { getApiKeys } from '../../../actions/api-key-actions';
import { Loader2, KeyRound } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../../../../components/ui/alert';

export default function AdminApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const keys = await getApiKeys();
      setApiKeys(keys);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Could not load API keys.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">API Key Management</h1>
      
      <Alert variant="default" className="mb-8 max-w-4xl">
        <AlertTitle>Hardcoded API Keys with Automatic Rotation</AlertTitle>
        <AlertDescription>
          The YouTube Data API keys are hardcoded for persistence and will automatically rotate if one key's quota is exhausted. To change them, the source code must be edited directly.
        </AlertDescription>
      </Alert>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Active API Keys</CardTitle>
          <CardDescription>
            These are the YouTube Data API v3 keys being used for all requests, in order of preference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading keys...</span>
             </div>
          ) : apiKeys.length > 0 ? (
            <div className="flex flex-col space-y-2">
              {apiKeys.map((key, index) => (
                <div key={index} className="flex items-center space-x-2">
                    <KeyRound className="h-5 w-5 text-muted-foreground" />
                    <span className="font-mono text-sm p-2 border rounded-md bg-muted">{maskApiKey(key)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No API keys are configured.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
