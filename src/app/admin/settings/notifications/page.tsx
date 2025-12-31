'use client';

import { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../../../components/ui/card';
import { Textarea } from '../../../../components/ui/textarea';
import { useToast } from '../../../../hooks/use-toast';
import { saveServiceAccount } from '../../../actions/save-service-account';
import { Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../../../../components/ui/alert';

export default function AdminNotificationSettingsPage() {
  const [serviceAccountJson, setServiceAccountJson] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!serviceAccountJson) {
      toast({ variant: 'destructive', title: 'Service account JSON cannot be empty.' });
      return;
    }
    
    let parsedJson;
    try {
        parsedJson = JSON.parse(serviceAccountJson);
    } catch(e) {
        toast({ variant: 'destructive', title: 'Invalid JSON', description: 'The provided text is not valid JSON.' });
        return;
    }

    setIsSaving(true);
    
    const result = await saveServiceAccount(serviceAccountJson);

    if (result.success) {
      toast({
        title: 'Credentials Saved',
        description: result.message,
      });
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
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">Push Notification Settings</h1>
      
      <Alert variant="destructive" className="mb-8 max-w-4xl">
        <AlertTitle>Security Warning</AlertTitle>
        <AlertDescription>
          You are about to handle sensitive credentials. In a production environment, you should use a secure secret manager instead of pasting keys here. The key will be stored in an environment variable for the current session.
        </AlertDescription>
      </Alert>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Firebase Service Account</CardTitle>
          <CardDescription>
            To send push notifications from the server, you need to provide your project's service account credentials.
            You can generate these from your Firebase project settings under "Service accounts".
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              id="service-account-json"
              placeholder='{ "type": "service_account", "project_id": "...", ... }'
              className="h-64 font-mono text-xs"
              value={serviceAccountJson}
              onChange={(e) => setServiceAccountJson(e.target.value)}
            />
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? 'Saving...' : 'Save Credentials'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
