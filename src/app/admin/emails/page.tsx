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
import { useCollection, useFirebase, useMemoFirebase } from '../../../firebase';
import type { EmailQueueItem } from '../../../lib/types';
import { collection, Timestamp, query, orderBy } from 'firebase/firestore';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { format } from 'date-fns';
import { Badge } from '../../../components/ui/badge';

function toDate(timestamp: Timestamp | Date | string): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
}

export default function AdminSendEmailPage() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const { firestore } = useFirebase();
  const emailQueueQuery = useMemoFirebase(() => query(collection(firestore, 'email_queue'), orderBy('createdAt', 'desc')), [firestore]);
  const { data: emails, isLoading: emailsLoading } = useCollection<EmailQueueItem>(emailQueueQuery);

  const [selectedEmail, setSelectedEmail] = useState<EmailQueueItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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

  const handlePreview = (email: EmailQueueItem) => {
    setSelectedEmail(email);
    setIsPreviewOpen(true);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">Send Email</h1>

      <Card className="max-w-2xl mb-8">
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

      <Card>
        <CardHeader>
          <CardTitle>Email History</CardTitle>
          <CardDescription>A log of recently queued emails.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>To</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Queued</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emailsLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" /> Loading history...
                  </TableCell>
                </TableRow>
              )}
              {emails?.map((email) => (
                <TableRow key={email.id} onClick={() => handlePreview(email)} className="cursor-pointer">
                  <TableCell className="font-medium">{email.to}</TableCell>
                  <TableCell>{email.message.subject}</TableCell>
                  <TableCell>
                    <Badge variant={email.status === 'sent' ? 'default' : (email.status === 'failed' ? 'destructive' : 'secondary')}>
                      {email.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(toDate(email.createdAt), 'PPP p')}</TableCell>
                </TableRow>
              ))}
               {!emailsLoading && emails?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No emails have been sent yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedEmail?.message.subject}</DialogTitle>
            <DialogDescription>To: {selectedEmail?.to}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 border rounded-lg bg-secondary/20 max-h-[60vh] overflow-y-auto">
            <div dangerouslySetInnerHTML={{ __html: selectedEmail?.message.html || '' }} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
