'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { useToast } from '../../../hooks/use-toast';
import { sendManualNotification } from '../../actions/send-manual-notification';
import { Loader2, Send } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../../../components/ui/alert';

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!title || !body) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please provide a title and a body for the notification.',
      });
      return;
    }

    setIsSending(true);

    try {
      const result = await sendManualNotification({ title, body, link, imageUrl });
      
      if (result.success) {
        toast({
          title: 'Notifications Sent!',
          description: result.message,
        });
        // Clear form
        setTitle('');
        setBody('');
        setLink('');
        setImageUrl('');
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to Send',
          description: result.message,
        });
      }
    } catch (error: any) {
      console.error('Error sending notification:', error);
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
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">Send Notification</h1>

      <Alert variant="default" className="mb-8">
        <AlertTitle>Important Note</AlertTitle>
        <AlertDescription>
          This will send a push notification to ALL users who have granted permission. Use this feature responsibly.
        </AlertDescription>
      </Alert>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Compose Notification</CardTitle>
          <CardDescription>Create the message you want to send to your users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title (Required)</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New Live Event Starting!" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="body">Body (Required)</Label>
            <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Join us now for the latest breaking news." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="link">Link (Optional)</Label>
            <Input id="link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://example.com/watch/live-event" />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="image-url">Image URL (Optional)</Label>
            <Input id="image-url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.png" />
             <p className="text-xs text-muted-foreground">An image to display in the notification.</p>
          </div>
        </CardContent>
        <div className="p-6 pt-0">
          <Button onClick={handleSubmit} disabled={isSending}>
            {isSending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {isSending ? 'Sending...' : 'Send Notification'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
