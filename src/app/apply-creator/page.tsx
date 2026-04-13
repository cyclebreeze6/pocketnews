'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { useUser, useFirebase, addDocumentNonBlocking, useCollection, useMemoFirebase, useDoc } from '../../firebase';
import { collection, query, where, serverTimestamp, doc, Timestamp } from 'firebase/firestore';
import { useToast } from '../../hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, Clock3, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import SiteHeader from '../../components/site-header';
import type { CreatorApplication, UserProfile } from '../../lib/types';

function PendingIllustration() {
  return (
    <div className="relative mx-auto h-44 w-44">
      <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
      <svg viewBox="0 0 200 200" className="relative h-full w-full">
        <circle cx="100" cy="100" r="78" className="fill-background stroke-primary/30" strokeWidth="4" />
        <circle cx="100" cy="100" r="62" className="fill-primary/5 stroke-primary/20" strokeWidth="3" strokeDasharray="8 8" />
        <circle cx="100" cy="100" r="42" className="fill-background stroke-primary/40" strokeWidth="3" />
        <path d="M100 74 L100 104 L120 116" className="stroke-primary" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="100" cy="100" r="5" className="fill-primary" />
      </svg>
      <Sparkles className="absolute -right-1 top-3 h-6 w-6 text-primary animate-bounce" />
      <Sparkles className="absolute left-0 bottom-6 h-4 w-4 text-primary/70 animate-pulse" />
    </div>
  );
}

function toMillis(value?: Timestamp | Date | string): number {
  if (!value) return 0;
  if (value instanceof Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return new Date(value).getTime();
}

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

  const applicationsQuery = useMemoFirebase(() => {
    if (!user || user.isAnonymous) return null;
    return query(collection(firestore, 'creator_applications'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: applications, isLoading: isApplicationsLoading } = useCollection<CreatorApplication>(applicationsQuery);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || user.isAnonymous) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const latestApplication = useMemo(() => {
    if (!applications || applications.length === 0) return null;
    return [...applications].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))[0];
  }, [applications]);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || user.isAnonymous) {
      toast({ variant: 'destructive', title: 'You must have a registered account to apply.' });
      return;
    }

    if (latestApplication?.status === 'pending') {
      toast({ title: 'Application already submitted', description: 'Your application is pending admin review.' });
      return;
    }

    if (latestApplication?.status === 'approved' || userProfile?.isCreator) {
      toast({ title: 'You are already approved as a creator.' });
      router.push('/creator');
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
      
      toast({ title: 'Application Submitted!', description: 'Your creator application is under admin review.' });
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Failed to submit application', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isUserLoading || isApplicationsLoading || isProfileLoading;

  if (isLoading) {
     return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!user || user.isAnonymous) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-xl">
            <CardHeader>
              <CardTitle className="text-3xl font-headline">Become a Creator</CardTitle>
              <CardDescription>Create or sign in to a registered account before applying.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Clock3 className="h-4 w-4" />
                <AlertTitle>Registration required</AlertTitle>
                <AlertDescription>
                  Creator applications are only available to registered users, not guest sessions.
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => router.push('/')}>Go to Home and Sign In</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (userProfile?.isCreator || latestApplication?.status === 'approved') {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-3xl font-headline">Creator Access Approved</CardTitle>
              <CardDescription>Your account is now approved to publish as a creator.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-green-200 bg-green-50 text-green-900">
                <CheckCircle2 className="h-4 w-4 text-green-700" />
                <AlertTitle>Approval complete</AlertTitle>
                <AlertDescription>
                  You can now access Creator Studio from your profile menu.
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => router.push('/creator')}>Open Creator Studio</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (latestApplication?.status === 'pending') {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-3xl font-headline">Application Pending Review</CardTitle>
              <CardDescription>
                Your creator application was received and is waiting for admin approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <PendingIllustration />
              <Alert className="border-yellow-200 bg-yellow-50 text-yellow-900">
                <Clock3 className="h-4 w-4 text-yellow-700" />
                <AlertTitle>Pending admin review</AlertTitle>
                <AlertDescription>
                  You will automatically get access to Creator Studio once an admin approves your application.
                </AlertDescription>
              </Alert>
              <Button variant="outline" className="w-full" onClick={() => router.push('/')}>Back to Home</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
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
            {latestApplication?.status === 'rejected' && (
              <Alert className="mb-6 border-red-200 bg-red-50 text-red-900">
                <XCircle className="h-4 w-4 text-red-700" />
                <AlertTitle>Previous application was rejected</AlertTitle>
                <AlertDescription>
                  You can submit a new application after reviewing your details and terms acceptance.
                </AlertDescription>
              </Alert>
            )}
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
