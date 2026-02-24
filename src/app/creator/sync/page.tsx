'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { useToast } from '../../../hooks/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import type { FetchResult } from '../../../ai/flows/sync-channels-flow';
import { Alert, AlertTitle, AlertDescription } from '../../../components/ui/alert';
import { useFirebase } from '../../../firebase';
import { getDocs, collection, where, query, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { fetchChannelVideos } from '../../actions/youtube-channel-videos-flow';
import type { Channel } from '../../../lib/types';


export default function CreatorSyncPage() {
  const [isFetching, setIsFetching] = useState(false);
  const [syncResult, setSyncResult] = useState<FetchResult | null>(null);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const handleSync = async () => {
    setIsFetching(true);
    setSyncResult(null);

    try {
        // Get channels and existing videos (client-side)
        const channelsQuery = query(collection(firestore, 'channels'), where('youtubeChannelUrl', '!=', null));
        const channelsSnapshot = await getDocs(channelsQuery);
        const channelsToSync: Channel[] = channelsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Channel));

        const videosSnapshot = await getDocs(collection(firestore, 'videos'));
        const existingYoutubeIds = new Set(videosSnapshot.docs.map(doc => doc.data().youtubeVideoId));

        if (channelsToSync.length === 0) {
            toast({ title: 'Sync Complete', description: "No channels are configured for syncing." });
            setSyncResult({ newVideosAdded: 0, syncedChannels: 0 });
            setIsFetching(false);
            return;
        }

        let totalNewVideos = 0;
        let successfulSyncs = 0;
        const errorMessages: string[] = [];
        const batch = writeBatch(firestore);

        for (const channel of channelsToSync) {
            if (!channel.youtubeChannelUrl) continue;

            try {
                const fetchedVideos = await fetchChannelVideos({ channelUrl: channel.youtubeChannelUrl, maxResults: 10 });

                const newVideosToSave = fetchedVideos
                    .filter(video => !existingYoutubeIds.has(video.videoId));

                if (newVideosToSave.length > 0) {
                    newVideosToSave.forEach(video => {
                        const newVideoRef = doc(collection(firestore, 'videos'));
                        const videoData = {
                            id: newVideoRef.id,
                            youtubeVideoId: video.videoId,
                            title: video.title,
                            description: video.description,
                            thumbnailUrl: video.thumbnailUrl,
                            channelId: channel.id,
                            contentCategory: 'News', // Default category
                            views: Math.floor(Math.random() * 100),
                            watchTime: Math.floor(Math.random() * 100),
                            regions: channel.region || ['Global'],
                            createdAt: serverTimestamp(),
                            uploadDate: serverTimestamp(),
                        };
                        batch.set(newVideoRef, videoData);
                        totalNewVideos++;
                    });
                }
                successfulSyncs++;

            } catch (error: any) {
                console.error(`Failed to sync channel "${channel.name}":`, error.message);
                errorMessages.push(`Channel "${channel.name}": ${error.message}`);
            }
        }

        if (totalNewVideos > 0) {
            await batch.commit();
        }

        const result: FetchResult = {
            newVideosAdded: totalNewVideos,
            syncedChannels: successfulSyncs,
            errors: errorMessages.length > 0 ? errorMessages : undefined,
        };
        setSyncResult(result);

        if (result.errors && result.errors.length > 0) {
            toast({
              variant: 'destructive',
              title: 'Sync Complete with Errors',
              description: `Synced ${result.syncedChannels} channels, but some failed.`,
            });
          } else {
            toast({
              title: 'Sync Complete!',
              description: `Added ${result.newVideosAdded} new videos from ${result.syncedChannels} channels.`,
            });
          }

    } catch (error: any) {
        console.error('An unexpected error occurred during sync:', error);
        toast({
            variant: 'destructive',
            title: 'Sync Failed',
            description: error.message || 'An unexpected error occurred. Please try again.',
        });
    } finally {
        setIsFetching(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Automatic Channel Sync</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sync All Channels</CardTitle>
          <CardDescription>
            Fetch the latest videos from all of your linked YouTube channels and automatically add them to your content library.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start gap-4">
            <Button onClick={handleSync} disabled={isFetching} size="lg">
              {isFetching ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Start Sync
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {syncResult && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Sync Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>Successfully synced <span className="font-bold">{syncResult.syncedChannels}</span> channels.</p>
              <p>Added a total of <span className="font-bold">{syncResult.newVideosAdded}</span> new videos.</p>
              {syncResult.errors && syncResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTitle>Errors Encountered</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1">
                      {syncResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
