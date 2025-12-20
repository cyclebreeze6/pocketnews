
'use client';

import SiteHeader from '../../components/site-header';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { Switch } from '../../components/ui/switch';
import { useFirebase, useUser } from '../../firebase';
import { useState, useEffect } from 'react';
import { requestNotificationPermission, isNotificationPermissionGranted } from '../../lib/firebase-notifications';
import { useToast } from '../../hooks/use-toast';

export default function SettingsPage() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check initial permission status on component mount
    const checkPermission = async () => {
        if(typeof window !== 'undefined' && 'Notification' in window) {
            const permissionGranted = await isNotificationPermissionGranted();
            setNotificationsEnabled(permissionGranted);
        }
    };
    checkPermission();
  }, []);

  const handleNotificationToggle = async (enabled: boolean) => {
    if (!user || !firestore) return;
    
    if (enabled) {
      try {
        const permissionGranted = await requestNotificationPermission(firestore, user.uid);
        if (permissionGranted) {
          setNotificationsEnabled(true);
          toast({ title: 'Notifications Enabled!' });
        } else {
          setNotificationsEnabled(false);
          toast({ variant: 'destructive', title: 'Permission Denied', description: 'You need to allow notifications in your browser settings.' });
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
        setNotificationsEnabled(false);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not enable notifications.' });
      }
    } else {
      // Logic to disable notifications (e.g., delete the token from Firestore) would go here.
      // For now, we just update the UI state.
      setNotificationsEnabled(false);
      toast({ title: 'Notifications Disabled' });
    }
  };


  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
       <main className="flex-1 py-12 md:py-16">
        <div className="container px-4 md:px-6 max-w-2xl mx-auto">
             <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">
                Settings
            </h1>

            <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Manage how you receive notifications.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="push-notifications">Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">Get push notifications when new videos are uploaded.</p>
                        </div>
                        <Switch id="push-notifications" checked={notificationsEnabled} onCheckedChange={handleNotificationToggle} />
                    </div>
                     <Separator />
                     <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="email-notifications">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive emails about new videos and channel updates.</p>
                        </div>
                        <Switch id="email-notifications" />
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Privacy</CardTitle>
                    <CardDescription>Control your privacy settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="flex items-start gap-3">
                        <Checkbox id="show-history" defaultChecked />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="show-history">Keep my watch history</Label>
                             <p className="text-sm text-muted-foreground">When this is on, we'll use your watch history to personalize your recommendations.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
             <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>Manage your account settings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive">Delete Account</Button>
                    <p className="text-xs text-muted-foreground mt-2">Permanently delete your account and all of your data. This action cannot be undone.</p>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
