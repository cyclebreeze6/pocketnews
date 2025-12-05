'use client';

import { useState, useMemo } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { fetchChannelVideos } from '../../actions/youtube-channel-videos-flow';
import type { YouTubeVideoDetails } from '../../actions/youtube-channel-videos-flow';
import Image from 'next/image';
import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '../../../firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import type { Channel, Category } from '../../../lib/types';
import { Checkbox } from '../../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';

interface VideoImportSelection {
  channelId?: string;
  categoryId?: string;
}

export default function CreatorImportVideosPage() {
  const [channelUrl, setChannelUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [fetchedVideos, setFetchedVideos] = useState<YouTubeVideoDetails[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<Record<string, boolean>>({});
  const [videoSelections, setVideoSelections] = useState<Record<string, VideoImportSelection>>({});
  
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const { data: channels } = useCollection<Channel>(channelsQuery);
  
  const categoriesQuery = useMemoFirebase(() => collection(firestore, 'categories'), [firestore]);
  const { data: categories } = useCollection<Category>(categoriesQuery);

  const handleFetchVideos = async () => {
    if (!channelUrl) {
      toast({ variant: 'destructive', title: 'Please enter a YouTube Channel URL.' });
      return;
    }
    setIsLoading(true);
    setFetchedVideos([]);
    setSelectedVideos({});
    setVideoSelections({});
    try {
      const result = await fetchChannelVideos({ channelUrl });
      if (result && result.length > 0) {
        setFetchedVideos(result);
        toast({ title: 'Success!', description: `Found ${result.length} videos.` });
      } else {
        toast({ variant: 'destructive', title: 'No videos found for this channel.' });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not fetch videos from the channel.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoSelectionChange = (videoId: string, checked: boolean) => {
    setSelectedVideos(prev => ({ ...prev, [videoId]: checked }));
  };

  const handleDetailChange = (videoId: string, type: 'channelId' | 'categoryId', value: string) => {
    setVideoSelections(prev => ({
      ...prev,
      [videoId]: {
        ...prev[videoId],
        [type]: value,
      },
    }));
  };
  
  const handleImportSelected = async () => {
    const videosToImport = Object.keys(selectedVideos).filter(id => selectedVideos[id]);
    if (videosToImport.length === 0) {
        toast({variant: 'destructive', title: 'No videos selected', description: 'Please select at least one video to import.'});
        return;
    }

    // Validation
    for (const videoId of videosToImport) {
        const selection = videoSelections[videoId];
        const videoTitle = fetchedVideos.find(v => v.videoId === videoId)?.title;
        if (!selection?.channelId) {
            toast({variant: 'destructive', title: 'Missing Channel', description: `Please select a channel for "${videoTitle}".`});
            return;
        }
    }
    
    setIsImporting(true);
    let importCount = 0;

    for (const videoId of videosToImport) {
      const videoData = fetchedVideos.find(v => v.videoId === videoId);
      const selection = videoSelections[videoId];
      const category = categories?.find(c => c.id === selection.categoryId);

      if (videoData && selection) {
          const videoDoc = {
            youtubeVideoId: videoData.videoId,
            title: videoData.title,
            description: videoData.description,
            thumbnailUrl: videoData.thumbnailUrl,
            channelId: selection.channelId!,
            contentCategory: category?.name || 'Uncategorized',
            createdAt: serverTimestamp(),
            uploadDate: new Date().toISOString(),
            views: Math.floor(Math.random() * 10000),
            watchTime: Math.floor(Math.random() * 2000),
          };
          
          try {
            const newDocRef = await addDocumentNonBlocking(collection(firestore, 'videos'), videoDoc);
            if(newDocRef) {
              await updateDocumentNonBlocking(newDocRef, { id: newDocRef.id });
              importCount++;
            }
          } catch(e) {
             console.error("Error importing video:", e);
          }
      }
    }
    
    setIsImporting(false);
    toast({title: 'Import Complete!', description: `${importCount} out of ${videosToImport.length} selected videos were imported.`});
    
    // Reset state after import
    setFetchedVideos([]);
    setSelectedVideos({});
    setVideoSelections({});
  };


  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">Import Videos from YouTube</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Fetch YouTube Channel Videos</CardTitle>
          <CardDescription>Enter the URL of a YouTube channel to fetch its most recent videos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="channel-url" className="sr-only">
                YouTube Channel URL
              </Label>
              <Input
                id="channel-url"
                placeholder="e.g., https://www.youtube.com/channel/UC-lHJZR3Gqxm24_Vd_AJ5Yw"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button onClick={handleFetchVideos} disabled={isLoading || !channelUrl}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fetch Videos
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {fetchedVideos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fetched Videos</CardTitle>
             <CardDescription>Review the videos below and select which ones to import.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fetchedVideos.map(video => (
                 <div key={video.videoId} className="flex items-start gap-4 p-4 rounded-lg border bg-card/50">
                    <div className="flex items-center pt-2">
                      <Checkbox 
                        id={`select-${video.videoId}`}
                        onCheckedChange={(checked) => handleVideoSelectionChange(video.videoId, !!checked)}
                        checked={selectedVideos[video.videoId] || false}
                      />
                    </div>
                    <Image src={video.thumbnailUrl} alt={video.title} width={160} height={90} className="rounded-md aspect-video object-cover" />
                    <div className="flex-1 space-y-2">
                        <h3 className="font-semibold line-clamp-2">{video.title}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor={`channel-${video.videoId}`}>Channel</Label>
                                <Select onValueChange={(value) => handleDetailChange(video.videoId, 'channelId', value)}>
                                    <SelectTrigger id={`channel-${video.videoId}`}>
                                        <SelectValue placeholder="Select channel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {channels?.map(channel => (
                                            <SelectItem key={channel.id} value={channel.id}>{channel.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor={`category-${video.videoId}`}>Category (Optional)</Label>
                                <Select onValueChange={(value) => handleDetailChange(video.videoId, 'categoryId', value)}>
                                    <SelectTrigger id={`category-${video.videoId}`}>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories?.map(category => (
                                            <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
              ))}
            </div>
             <div className="flex justify-end mt-6">
                <Button onClick={handleImportSelected} disabled={isImporting}>
                  {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Import Selected Videos
                </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
