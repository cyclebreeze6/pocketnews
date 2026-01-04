
'use client';

import { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { useToast } from '../../../../hooks/use-toast';
import { saveApiKey } from '../../../actions/save-api-key';
import { Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../../../../components/ui/alert';

export default function AdminApiKeysPage() {
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!youtubeApiKey) {
      toast({ variant: 'destructive', title: 'API Key cannot be empty.' });
      return;
    }

    setIsSaving(true);
    
    const result = await saveApiKey('YOUTUBE_API_KEY', youtubeApiKey);

    if (result.success) {
      toast({
        title: 'API Key Saved',
        description: result.message,
      });
      setYoutubeApiKey(''); // Clear the input for security
    } else {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: result.message,
      });
    }

    setIsSaving(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">API Key Management</h1>
      
      <Alert variant="default" className="mb-8 max-w-4xl">
        <AlertTitle>API Key Usage</AlertTitle>
        <AlertDescription>
          Provide your own YouTube Data API key to avoid "Quota Exceeded" errors. The key is only stored for the current server session and is not saved in the database.
        </AlertDescription>
      </Alert>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>YouTube Data API</CardTitle>
          <CardDescription>
            Enter your YouTube Data API v3 key. You can get one from the Google Cloud Console.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
             <Label htmlFor="youtube-api-key">API Key</Label>
            <Input
              id="youtube-api-key"
              type="password"
              placeholder="AIzaSy..."
              className="font-mono text-xs"
              value={youtubeApiKey}
              onChange={(e) => setYoutubeApiKey(e.target.value)}
            />
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? 'Saving...' : 'Save API Key'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
