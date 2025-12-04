'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { fetchChannelVideos } from '../../../ai/flows/youtube-channel-videos-flow';
import type { YouTubeVideoDetails } from '../../../ai/flows/youtube-channel-videos-flow';
import Image from 'next/image';
import { useFirebase, useCollection, useMemoFirebase } from '../../../firebase';
import { collection } from 'firebase/firestore';
import type { Channel } from '../../../lib/types';


export default function ImportVideosPage() {
  const [channelUrl, setChannelUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedVideos, setFetchedVideos] = useState<YouTubeVideoDetails[]>([]);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const { data: channels } = useCollection<Channel>(channelsQuery);
  const channelNames = useMemo(() => new Map(channels?.map(c => [c.id, c.name])), [channels]);


  const handleFetchVideos = async () => {
    if (!channelUrl) {
      toast({ variant: 'destructive', title: 'Please enter a YouTube Channel URL.' });
      return;
    }
    setIsLoading(true);
    setFetchedVideos([]);
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
                 <div key={video.videoId} className="flex items-start gap-4 p-2 rounded-lg border">
                    <Image src={video.thumbnailUrl} alt={video.title} width={120} height={90} className="rounded-md aspect-video object-cover" />
                    <div className="flex-1">
                        <h3 className="font-semibold line-clamp-2">{video.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            By {video.authorName}
                        </p>
                    </div>
                </div>
              ))}
            </div>
             <div className="flex justify-end mt-6">
                <Button>Import Selected Videos (Coming Soon)</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
