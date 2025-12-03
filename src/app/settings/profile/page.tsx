'use client';

import SiteHeader from '../../../components/site-header';
import { useDoc, useFirebase, useUser, setDocumentNonBlocking, useMemoFirebase, uploadFile, useStorage } from '../../../firebase';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { doc } from 'firebase/firestore';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '../../../hooks/use-toast';
import type { UserProfile } from '../../../lib/types';
import { Loader2 } from 'lucide-react';
import { getAuth, updateProfile } from 'firebase/auth';

export default function ProfileSettingsPage() {
    const { firestore } = useFirebase();
    const storage = useStorage();
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setDisplayName(userProfile.displayName || '');
            setEmail(userProfile.email || '');
            setAvatarUrl(userProfile.avatar || '');
        } else if (user) {
            setDisplayName(user.displayName || '');
            setEmail(user.email || '');
            setAvatarUrl(user.photoURL || '');
        }
    }, [userProfile, user]);

    const handleSaveChanges = async () => {
        if (!user || !userProfileRef) return;
        setIsSaving(true);
        try {
            const auth = getAuth();
            if (auth.currentUser) {
                 await updateProfile(auth.currentUser, { displayName });
            }
            const profileData = {
                displayName,
            };
            setDocumentNonBlocking(userProfileRef, profileData, { merge: true });
            toast({ title: 'Profile updated successfully!' });
        } catch(error) {
            console.error("Error updating profile: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update profile.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user || !storage) return;

        setIsUploading(true);
        try {
            const filePath = `user-avatars/${user.uid}/${Date.now()}_${file.name}`;
            const newAvatarUrl = await uploadFile(storage, file, filePath);
            
            // Update auth profile
            const auth = getAuth();
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { photoURL: newAvatarUrl });
            }

            // Update firestore profile
            if(userProfileRef) {
                setDocumentNonBlocking(userProfileRef, { avatar: newAvatarUrl }, { merge: true });
            }

            setAvatarUrl(newAvatarUrl); // Update local state to show new avatar immediately
            toast({ title: 'Photo updated successfully!' });
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            toast({ variant: 'destructive', title: 'Upload failed', description: 'Could not update your photo.' });
        } finally {
            setIsUploading(false);
        }
    };

    const isLoading = isUserLoading || isProfileLoading;

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
                            <AvatarImage src={avatarUrl || `https://avatar.vercel.sh/${user?.uid}.png`} alt={displayName} />
                            <AvatarFallback>{displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                {isUploading ? 'Uploading...' : 'Change Photo'}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">JPG, GIF or PNG. 1MB max.</p>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={isSaving}/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled />
                    </div>

                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
