
'use client';

import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { useDoc, useCollection, useFirebase, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '../../../../firebase';
import type { Short, Channel } from '../../../../lib/types';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Loader2, PlusCircle, ArrowLeft } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { useState, useEffect } from 'react';
import { useToast } from '../../../../hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { fetchYouTubeVideoInfo } from '../../../actions/youtube-info-flow';
import type { YouTubeVideoInfo } from '../../../../ai/flows/youtube-info-flow';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function ShortEditPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const shortId = params.shortId as string;
  const isNewShort = shortId === 'new';

  const shortRef = useMemoFirebase(() => isNewShort ? null : doc(firestore, 'shorts', shortId), [firestore, shortId, isNewShort]);
  const { data: existingShort, isLoading: shortLoading } = useDoc<Short>(shortRef);
  
  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const { data: channels } = useCollection<Channel>(channelsQuery);
  
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shortDetails, setShortDetails] = useState<Partial<Short> | null>(null);
  
  useEffect(() => {
    // Pre-fill from URL query param for new shorts
    const urlFromQuery = searchParams.get('youtubeUrl');
    if (urlFromQuery && isNewShort) {
      setYoutubeUrl(urlFromQuery);
      handleFetchDetails(urlFromQuery);
    }
  }, [searchParams, isNewShort]);

  useEffect(() => {
    if (existingShort) {
      setShortDetails({ ...existingShort });
    }
  }, [existingShort]);

  const handleFetchDetails = async (urlToFetch?: string) => {
    const finalUrl = urlToFetch || youtubeUrl;
    if (!finalUrl) {
      toast({ variant: 'destructive', title: 'Please enter a YouTube URL.' });
      return;
    }
    setIsFetching(true);
    try {
      const videoInfo: YouTubeVideoInfo = await fetchYouTubeVideoInfo({ videoUrl: finalUrl });
      if (videoInfo && videoInfo.title) {
        setShortDetails(prev => ({
            ...prev,
            youtubeVideoId: videoInfo.videoId,
            title: videoInfo.title,
            thumbnailUrl: videoInfo.thumbnailUrl,
        }));
        toast({ title: 'Details Fetched!', description: 'Video info has been pre-filled.' });
      } else {
        toast({ variant: 'destructive', title: 'Could not fetch video details.' });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred while fetching video details.' });
    } finally {
      setIsFetching(false);
    }
  };
  
  const handleSaveChanges = async () => {
    if (!shortDetails?.title || !shortDetails?.channelId || !shortDetails?.youtubeVideoId || !shortDetails?.thumbnailUrl) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please ensure all fields are filled.' });
      return;
    }
    
    setIsSaving(true);
    const dataToSave: Partial<Short> = {
      ...shortDetails,
      views: shortDetails.views || Math.floor(Math.random() * 5000),
    };

    if (isNewShort) {
      dataToSave.createdAt = serverTimestamp();
      const newDocRef = doc(collection(firestore, 'shorts'));
      dataToSave.id = newDocRef.id;
      await setDoc(newDocRef, dataToSave, {});
      toast({ title: 'Short Added!', description: `${dataToSave.title} has been added.` });
    } else {
      updateDocumentNonBlocking(shortRef!, dataToSave);
      toast({ title: 'Short Updated!', description: `${dataToSave.title} has been updated.` });
    }
    setIsSaving(false);
    
    router.push('/creator/shorts');
  };
  
  if (shortLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                {isNewShort ? 'Add New Short' : 'Edit Short'}
            </h1>
        </div>
      
        <Card>
            <CardHeader>
                <CardTitle>Short Details</CardTitle>
                <CardDescription>
                {isNewShort ? 'Fetch details from a YouTube URL to create a short.' : 'Edit the details for this short.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {isNewShort && (
                     <div className="grid gap-2">
                        <Label htmlFor="youtube-url">YouTube URL</Label>
                        <div className="flex gap-2">
                            <Input
                            id="youtube-url"
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            disabled={isFetching}
                            />
                            <Button onClick={() => handleFetchDetails()} disabled={isFetching || !youtubeUrl}>
                            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch'}
                            </Button>
                        </div>
                    </div>
                )}
               
                {shortDetails && (
                <div className="grid md:grid-cols-3 gap-6 items-start">
                    <div className="md:col-span-1">
                        <Label>Thumbnail</Label>
                        {shortDetails.thumbnailUrl && (
                            <Image src={shortDetails.thumbnailUrl} alt={shortDetails.title || 'Short thumbnail'} width={180} height={320} className="rounded-md mt-2 aspect-[9/16] object-cover" />
                        )}
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" value={shortDetails.title || ''} onChange={e => setShortDetails(prev => ({...prev, title: e.target.value}))} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="channel-select">Assign to Channel</Label>
                            <Select onValueChange={(value) => setShortDetails(prev => ({...prev, channelId: value}))} value={shortDetails.channelId || ''}>
                                <SelectTrigger id="channel-select">
                                    <SelectValue placeholder="Select a channel..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {channels?.map((channel) => (
                                    <SelectItem key={channel.id} value={channel.id}>
                                        {channel.name}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                )}

            </CardContent>
            <div className="p-6 pt-0">
                 <Button onClick={handleSaveChanges} disabled={isSaving || !shortDetails}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
                </Button>
            </div>
        </Card>
    </div>
  );
}
