'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { useToast } from '../../../hooks/use-toast';
import { sendSingleEmail } from '../../actions/send-broadcast-email';
import { Loader2, Send } from 'lucide-react';

export default function AdminSendEmailPage() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!to || !subject || !htmlBody) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please provide a recipient email, subject, and message body.',
      });
      return;
    }

    setIsSending(true);

    try {
      const result = await sendSingleEmail({ to, subject, htmlBody });
      
      if (result.success) {
        toast({
          title: 'Email Queued!',
          description: result.message,
        });
        // Clear form
        setTo('');
        setSubject('');
        setHtmlBody('');
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to Queue Email',
          description: result.message,
        });
      }
    } catch (error: any) {
      console.error('Error queuing email:', error);
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
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">Send Email</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Compose Email</CardTitle>
          <CardDescription>Create the message you want to send. You can use HTML for formatting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="to">To (Required)</Label>
            <Input id="to" type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com" />
          </div>
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
            {isSending ? 'Queueing Email...' : 'Queue Email'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
