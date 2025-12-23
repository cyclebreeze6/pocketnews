
'use client';

import SiteHeader from '../../components/site-header';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { Switch } from '../../components/ui/switch';
import { useUser } from '../../firebase';
import { useState, useEffect } from 'react';
import { useToast } from '../../hooks/use-toast';

export default function SettingsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
        const OneSignal = window.OneSignal;
        if(typeof window !== 'undefined' && OneSignal?.Notifications) {
          const permission = OneSignal.Notifications.permission;
          setNotificationsEnabled(permission);
        }
    };
    checkPermission();
  }, []);

  const handleNotificationToggle = async (enabled: boolean) => {
    const OneSignal = window.OneSignal;
    if (!user || !OneSignal) return;
    
    if (enabled) {
      try {
        await OneSignal.Notifications.requestPermission();
        const permission = OneSignal.Notifications.permission;
        if (permission) {
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
      // OneSignal does not provide a direct API to "un-subscribe" a user via code 
      // as a security measure. Users must disable it from their browser settings.
      setNotificationsEnabled(false);
      toast({ title: 'Notifications Disabled', description: 'Please manage permissions in your browser settings.' });
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

    