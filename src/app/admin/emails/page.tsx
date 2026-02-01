'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { useToast } from '../../../hooks/use-toast';
import { sendBroadcastEmail } from '../../actions/send-broadcast-email';
import { Loader2, Send } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../../../components/ui/alert';

export default function AdminSendEmailPage() {
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!subject || !htmlBody) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please provide a subject and a message body.',
      });
      return;
    }

    setIsSending(true);

    try {
      const result = await sendBroadcastEmail({ subject, htmlBody });
      
      if (result.success) {
        toast({
          title: 'Emails Queued!',
          description: result.message,
        });
        // Clear form
        setSubject('');
        setHtmlBody('');
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to Queue Emails',
          description: result.message,
        });
      }
    } catch (error: any) {
      console.error('Error queuing emails:', error);
      toast({
        variant: 'destructive',
        title: 'An unexpected error occurred.',
        description: error.message || 'Please check the console for more details.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">Send Broadcast Email</h1>

      <Alert variant="default" className="mb-8">
        <AlertTitle>Important Note</AlertTitle>
        <AlertDescription>
          This will queue an email to be sent to ALL users in the database. Use this feature responsibly. Emails are sent by a backend service.
        </AlertDescription>
      </Alert>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Compose Email</CardTitle>
          <CardDescription>Create the message you want to send to your users. You can use HTML for formatting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject (Required)</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="An important update for you" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="htmlBody">Message Body (Required)</Label>
            <Textarea id="htmlBody" value={htmlBody} onChange={(e) => setHtmlBody(e.target.value)} placeholder="<p>Hello,</p><p>This is an important update...</p>" className="h-48 font-mono" />
          </div>
        </CardContent>
        <div className="p-6 pt-0">
          <Button onClick={handleSubmit} disabled={isSending}>
            {isSending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {isSending ? 'Queueing Emails...' : 'Queue Broadcast Email'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
