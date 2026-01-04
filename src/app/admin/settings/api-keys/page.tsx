
'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { useToast } from '../../../../hooks/use-toast';
import { addApiKey, getApiKeys, removeApiKey } from '../../../actions/api-key-actions';
import { Loader2, Trash2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../../../../components/ui/alert';

export default function AdminApiKeysPage() {
  const [newApiKey, setNewApiKey] = useState('');
  const [savedKeys, setSavedKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const keys = await getApiKeys();
      setSavedKeys(keys);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Could not load API keys.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleAddKey = async () => {
    if (!newApiKey) {
      toast({ variant: 'destructive', title: 'API Key cannot be empty.' });
      return;
    }

    setIsLoading(true);
    const result = await addApiKey(newApiKey);
    if (result.success) {
      toast({ title: 'API Key Added', description: result.message });
      setNewApiKey('');
      await fetchKeys(); // Refresh the list
    } else {
      toast({ variant: 'destructive', title: 'Save Failed', description: result.message });
      setIsLoading(false);
    }
  };

  const handleRemoveKey = async (keyToRemove: string) => {
    setIsLoading(true);
    const result = await removeApiKey(keyToRemove);
    if (result.success) {
      toast({ title: 'API Key Removed', description: result.message });
      await fetchKeys(); // Refresh the list
    } else {
      toast({ variant: 'destructive', title: 'Removal Failed', description: result.message });
      setIsLoading(false);
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">API Key Management</h1>
      
      <Alert variant="default" className="mb-8 max-w-4xl">
        <AlertTitle>Automatic API Key Rotation</AlertTitle>
        <AlertDescription>
          Add multiple YouTube Data API keys to avoid "Quota Exceeded" errors. The system will automatically switch to another key if the current one runs out of quota.
        </AlertDescription>
      </Alert>

      <Card className="max-w-4xl mb-8">
        <CardHeader>
          <CardTitle>Add New API Key</CardTitle>
          <CardDescription>
            Enter a new YouTube Data API v3 key. You can get keys from the Google Cloud Console.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="youtube-api-key">New API Key</Label>
            <div className="flex gap-2">
              <Input
                id="youtube-api-key"
                type="password"
                placeholder="AIzaSy..."
                className="font-mono text-xs"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
              />
              <Button onClick={handleAddKey} disabled={isLoading || !newApiKey}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add Key
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Saved API Keys</CardTitle>
          <CardDescription>
            This is the list of keys currently in the rotation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading keys...</span>
             </div>
          ) : (
            <div className="space-y-2">
              {savedKeys.length > 0 ? (
                savedKeys.map((key, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                    <span className="font-mono text-sm">{maskApiKey(key)}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveKey(key)} disabled={isLoading}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No API keys have been added yet.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
