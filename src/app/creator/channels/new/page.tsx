'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowLeft, Loader2, Tv } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { Textarea } from '../../../../../components/ui/textarea';
import { useFirebase, useStorage, uploadFile, useUser } from '../../../../../firebase';
import { useToast } from '../../../../../hooks/use-toast';
import { fetchYouTubeChannelInfo } from '../../../../actions/youtube-channel-info-flow';

export default function CreatorCreateChannelPage() {
  const { firestore } = useFirebase();
  const storage = useStorage();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [youtubeChannelUrl, setYoutubeChannelUrl] = useState('');
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [youtubeChannelId, setYoutubeChannelId] = useState<string>('');
  const [channelRegions, setChannelRegions] = useState<string[]>(['Global']);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFetchChannelInfo = async () => {
    if (!youtubeChannelUrl.trim()) {
      toast({ variant: 'destructive', title: 'Paste a YouTube channel URL first.' });
      return;
    }

    setIsFetchingInfo(true);
    try {
      const info = await fetchYouTubeChannelInfo({ channelUrl: youtubeChannelUrl.trim() });
      setChannelName(info.name || '');
      setChannelDescription(info.description || '');
      setLogoPreview(info.logoUrl || null);
      setYoutubeChannelId(info.youtubeChannelId || '');
      setChannelRegions(info.region && info.region.length > 0 ? info.region : ['Global']);
      toast({ title: 'Channel details fetched', description: 'Review and update before creating.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Auto fetch failed', description: error.message || 'Could not fetch channel info.' });
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreateChannel = async () => {
    if (!user) return;
    if (!channelName.trim()) {
      toast({ variant: 'destructive', title: 'Channel name is required.' });
      return;
    }

    setIsSaving(true);
    try {
      let finalLogoUrl = logoPreview || '';
      if (logoFile) {
        const filePath = `channel-logos/${Date.now()}_${logoFile.name}`;
        finalLogoUrl = await uploadFile(storage, logoFile, filePath);
      }

      const channelRef = doc(collection(firestore, 'channels'));
      await setDoc(channelRef, {
        id: channelRef.id,
        name: channelName.trim(),
        description: channelDescription.trim(),
        logoUrl: finalLogoUrl,
        youtubeChannelUrl: youtubeChannelUrl.trim(),
        youtubeChannelId: youtubeChannelId || undefined,
        region: channelRegions,
        creatorId: user.uid,
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Channel created', description: `${channelName} is ready.` });
      router.push('/creator/channels');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to create channel', description: error.message || 'Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Create Creator Channel</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Channel Setup</CardTitle>
          <CardDescription>Paste your channel URL to auto-fill details, then review and create.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="channel-url">YouTube Channel URL</Label>
            <div className="flex gap-2">
              <Input
                id="channel-url"
                value={youtubeChannelUrl}
                onChange={(e) => setYoutubeChannelUrl(e.target.value)}
                placeholder="https://www.youtube.com/@yourchannel"
              />
              <Button onClick={handleFetchChannelInfo} disabled={isFetchingInfo || !youtubeChannelUrl.trim()}>
                {isFetchingInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Auto Fetch'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="channel-name">Channel Name</Label>
                <Input id="channel-name" value={channelName} onChange={(e) => setChannelName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel-description">Description</Label>
                <Textarea id="channel-description" value={channelDescription} onChange={(e) => setChannelDescription(e.target.value)} className="h-28" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-file">Channel Logo</Label>
              <div className="relative w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground overflow-hidden">
                {logoPreview ? (
                  <Image src={logoPreview} alt="Channel logo" fill className="object-cover" />
                ) : (
                  <Tv className="w-14 h-14" />
                )}
              </div>
              <Input id="logo-file" type="file" accept="image/*" onChange={handleLogoFileChange} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleCreateChannel} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Channel'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
