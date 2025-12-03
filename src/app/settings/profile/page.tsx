
'use client';

import SiteHeader from '../../../components/site-header';
import { useDoc, useFirebase, useUser, setDocumentNonBlocking, useMemoFirebase } from '../../../firebase';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { doc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { useToast } from '../../../hooks/use-toast';
import type { UserProfile } from '../../../lib/types';

export default function ProfileSettingsPage() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const { toast } = useToast();

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading } = useDoc<UserProfile>(userProfileRef);

    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (userProfile) {
            setDisplayName(userProfile.displayName || '');
            setEmail(userProfile.email || '');
        } else if (user) {
            setDisplayName(user.displayName || '');
            setEmail(user.email || '');
        }
    }, [userProfile, user]);

    const handleSaveChanges = () => {
        if (!user || !userProfileRef) return;
        const profileData = {
            id: user.uid,
            displayName,
            email
        };
        setDocumentNonBlocking(userProfileRef, profileData, { merge: true });
        toast({ title: 'Profile updated successfully!' });
    };

    if (isLoading) {
        return <div>Loading profile...</div>;
    }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-16">
        <div className="container px-4 md:px-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">
                Profile Settings
            </h1>
            <Card>
                <CardHeader>
                    <CardTitle>Your Profile</CardTitle>
                    <CardDescription>Manage your public profile information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-20 h-20">
                            <AvatarImage src={user?.photoURL || `https://avatar.vercel.sh/${user?.uid}.png`} alt={displayName} />
                            <AvatarFallback>{displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <Button>Change Photo</Button>
                            <p className="text-xs text-muted-foreground mt-2">JPG, GIF or PNG. 1MB max.</p>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled />
                    </div>

                    <Button onClick={handleSaveChanges}>Save Changes</Button>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
