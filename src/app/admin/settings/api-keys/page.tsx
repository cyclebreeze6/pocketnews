
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../../../components/ui/card';
import { useToast } from '../../../../hooks/use-toast';
import { getApiKeys } from '../../../actions/api-key-actions';
import { Loader2, KeyRound } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../../../../components/ui/alert';

export default function AdminApiKeysPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchKey = async () => {
    setIsLoading(true);
    try {
      const keys = await getApiKeys();
      if (keys.length > 0) {
        setApiKey(keys[0]);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Could not load API key.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKey();
  }, []);

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">API Key Management</h1>
      
      <Alert variant="default" className="mb-8 max-w-4xl">
        <AlertTitle>Hardcoded API Key</AlertTitle>
        <AlertDescription>
          The YouTube Data API key is currently hardcoded to prevent it from being lost between server sessions. To change it, the source code must be edited directly.
        </AlertDescription>
      </Alert>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Active API Key</CardTitle>
          <CardDescription>
            This is the YouTube Data API v3 key being used for all requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading key...</span>
             </div>
          ) : apiKey ? (
            <div className="flex items-center space-x-2">
                <KeyRound className="h-5 w-5 text-muted-foreground" />
                <span className="font-mono text-sm p-2 border rounded-md bg-muted">{maskApiKey(apiKey)}</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No API key is configured.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
