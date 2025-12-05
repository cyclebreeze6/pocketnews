'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { useToast } from '../../../hooks/use-toast';
import { Loader2, RefreshCw, CheckCircle, XCircle, UploadCloud } from 'lucide-react';
import { fetchNewYouTubeVideos } from '../../actions/youtube-fetch-new-videos-flow';
import type { FetchedVideo } from '../../actions/youtube-fetch-new-videos-flow';
import { useCollection, useFirebase, useMemoFirebase } from '../../../firebase';
import type { Channel, Category } from '../../../lib/types';
import { collection } from 'firebase/firestore';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import { saveSyncedVideos } from '../../actions/save-synced-videos';

type VideoForCuration = FetchedVideo & {
    channelId?: string;
    contentCategory?: string;
    isSelected: boolean;
};

export default function CreatorSyncPage() {
  const [isFetching, setIsFetching] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [fetchedVideos, setFetchedVideos] = useState<VideoForCuration[]>([]);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const { data: channels } = useCollection<Channel>(channelsQuery);
  const categoriesQuery = useMemoFirebase(() => collection(firestore, 'categories'), [firestore]);
  const { data: categories } = useCollection<Category>(categoriesQuery);
  
  const handleFetch = async () => {
    setIsFetching(true);
    setFetchedVideos([]);

    try {
      const result = await fetchNewYouTubeVideos();
      if (result.errors && result.errors.length > 0) {
        toast({
            variant: 'destructive',
            title: 'Sync Complete with Errors',
            description: `Some channels failed to sync: ${result.errors.join(', ')}`
        });
      }
      if (result.videos.length > 0) {
        setFetchedVideos(result.videos.map(v => ({ ...v, isSelected: true }))); // Default to selected
        toast({
            title: 'Videos Fetched!',
            description: `Found ${result.videos.length} new videos ready for curation.`
        });
      } else {
         toast({
            title: 'No New Videos',
            description: `All channels are up to date.`
        });
      }

    } catch (error: any) {
      console.error('An unexpected error occurred during fetch:', error);
      toast({
        variant: 'destructive',
        title: 'Fetch Failed',
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handlePublish = async () => {
      const videosToPublish = fetchedVideos.filter(v => v.isSelected && v.channelId && v.contentCategory);

      if (videosToPublish.length === 0) {
          toast({ variant: 'destructive', title: 'Nothing to publish', description: 'Please select and configure at least one video.'});
          return;
      }
      
      setIsPublishing(true);
      try {
          const videosData = videosToPublish.map(video => ({
            youtubeVideoId: video.videoId,
            title: video.title,
            description: video.description,
            thumbnailUrl: video.thumbnailUrl,
            channelId: video.channelId!,
            contentCategory: video.contentCategory!,
            views: Math.floor(Math.random() * 100),
            watchTime: Math.floor(Math.random() * 100),
          }));
          
          await saveSyncedVideos(videosData);
          toast({ title: 'Success!', description: `${videosData.length} videos have been published.`});
          setFetchedVideos([]); // Clear the list after publishing
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Publish failed', description: error.message || 'Could not save videos.'});
      } finally {
          setIsPublishing(false);
      }
  };
  
  const handleVideoChange = (index: number, key: 'channelId' | 'contentCategory' | 'isSelected', value: string | boolean) => {
    const updatedVideos = [...fetchedVideos];
    const videoToUpdate = updatedVideos[index];
    if (videoToUpdate) {
        (videoToUpdate as any)[key] = value;
        setFetchedVideos(updatedVideos);
    }
  };

  const selectedCount = fetchedVideos.filter(v => v.isSelected).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Curate & Sync</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Content Curation Workbench</CardTitle>
          <CardDescription>
            Fetch the latest 10 videos from your linked YouTube channels. Then, select a channel and category for each before publishing them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start gap-4">
            <Button onClick={handleFetch} disabled={isFetching || isPublishing} size="lg">
              {isFetching ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Fetching Videos...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Fetch New Videos
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {fetchedVideos.length > 0 && (
          <div className="mt-8">
            <Card>
                 <CardHeader>
                    <CardTitle>Curation List ({selectedCount} selected)</CardTitle>
                    <CardDescription>Review the videos below, assign them, and publish.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {fetchedVideos.map((video, index) => (
                        <div key={video.videoId} className="flex flex-col md:flex-row items-start gap-4 p-4 border rounded-lg bg-card/50">
                            <Image src={video.thumbnailUrl} alt={video.title} width={192} height={108} className="rounded-md aspect-video object-cover" />
                            <div className="flex-grow">
                                <h3 className="font-semibold">{video.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                <div className="grid gap-1.5 w-full">
                                    <Label htmlFor={`channel-${index}`}>Channel</Label>
                                    <Select value={video.channelId} onValueChange={(value) => handleVideoChange(index, 'channelId', value)}>
                                        <SelectTrigger id={`channel-${index}`} className="w-full md:w-[180px]">
                                            <SelectValue placeholder="Select channel..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {channels?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5 w-full">
                                    <Label htmlFor={`category-${index}`}>Category</Label>
                                     <Select value={video.contentCategory} onValueChange={(value) => handleVideoChange(index, 'contentCategory', value)}>
                                        <SelectTrigger id={`category-${index}`} className="w-full md:w-[180px]">
                                            <SelectValue placeholder="Select category..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories?.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex items-center h-full pt-6">
                                <Checkbox checked={video.isSelected} onCheckedChange={(checked) => handleVideoChange(index, 'isSelected', !!checked)} />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
            <div className="mt-8 flex justify-end">
                <Button onClick={handlePublish} disabled={isPublishing || selectedCount === 0} size="lg">
                    {isPublishing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UploadCloud className="mr-2 h-5 w-5" />}
                    Publish {selectedCount} Videos
                </Button>
            </div>
          </div>
      )}
    </div>
  );
}
