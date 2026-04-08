'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useUser, useFirebase, addDocumentNonBlocking } from '../../firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../../hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import SiteHeader from '../../components/site-header';
import type { CreatorApplication } from '../../lib/types';

export default function ApplyCreatorPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [ninNumber, setNinNumber] = useState('');
  const [contentType, setContentType] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in to apply.' });
      return;
    }

    if (!ninNumber || !contentType || !termsAccepted) {
      toast({ variant: 'destructive', title: 'Please complete all required fields.' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const applicationsRef = collection(firestore, 'creator_applications');
      const applicationData: Partial<CreatorApplication> = {
        userId: user.uid,
        email: email || user.email || '',
        contentTypes: [contentType], // Storing as array for future expansion if needed
        ninNumber,
        termsAccepted,
        status: 'pending',
        createdAt: serverTimestamp() as any,
      };

      await addDocumentNonBlocking(applicationsRef, applicationData);
      
      toast({ title: 'Application Submitted!', description: 'Your creator application is under review. Please wait for an admin to approve it.' });
      router.push('/');
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Failed to submit application', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading) {
     return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-3xl font-headline">Apply to be a Creator</CardTitle>
            <CardDescription>
              Join our platform to upload videos, podcasts, and documentaries. Once approved, you can earn revenue from your content!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  disabled={!!user?.email} 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nin">NIN Number (National Identity Number)</Label>
                <Input 
                  id="nin" 
                  value={ninNumber} 
                  onChange={(e) => setNinNumber(e.target.value)} 
                  placeholder="Enter your valid NIN"
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content-type">What type of content will you primarily post?</Label>
                <Select onValueChange={setContentType} value={contentType} required>
                  <SelectTrigger id="content-type">
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Short Videos">Short Videos</SelectItem>
                    <SelectItem value="Full Documentaries">Full Documentaries</SelectItem>
                    <SelectItem value="Podcasts">Podcasts</SelectItem>
                    <SelectItem value="Interviews">Interviews</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start space-x-3 pt-4 border-t">
                <Checkbox 
                  id="terms" 
                  checked={termsAccepted} 
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} 
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="terms" className="text-sm font-medium leading-tight">
                    I agree to the Creator Terms & Conditions
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    By submitting this application, you agree to the following conditions: <br/>
                    1. You confirm that you own all the rights to the videos and content you upload. <br/>
                    2. We operate on a revenue-share model. You qualify for monetization at 10,000 views. POCKETNEWS pays out a 60% share of earnings based on a standard rate (N600 total per 1,000 views). <br/>
                    3. Your videos can be taken down for copyright strikes or if they go against our community standards (including nudity, violence, promoting propaganda, gambling, and failure to add explicit age limits/warnings to videos).
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || !termsAccepted}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
