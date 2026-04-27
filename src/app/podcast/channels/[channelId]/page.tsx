'use client';

import { useMemo, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { collection, doc, query, where, orderBy } from 'firebase/firestore';
import SiteHeader from '../../../../components/site-header';
import { PodcastPlayer } from '../../../../components/podcast-player';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Skeleton } from '../../../../components/ui/skeleton';
import { useCollection, useDoc, useFirebase, useMemoFirebase } from '../../../../firebase';
import type { Channel, Podcast } from '../../../../lib/types';
import { Tv, Mic, PlayCircle, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

const toDate = (timestamp: Timestamp | Date | string): Date => {
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  if (timestamp && typeof (timestamp as any).seconds === 'number') return new Date((timestamp as any).seconds * 1000);
  return new Date(timestamp as string);
};

function ChannelPageSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader hideCategoryNav={true} />
      <main className="flex-1">
        <section className="w-full py-12 md:py-16 lg:py-20 bg-card/50 border-b">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <Skeleton className="w-24 h-24 rounded-full mb-4" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-6 w-2/3" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function PodcastChannelPage() {
  const params = useParams();
  const channelId = params.channelId as string;
  const { firestore } = useFirebase();

  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [currentPodcastId, setCurrentPodcastId] = useState<string | null>(null);
  const [playerKey, setPlayerKey] = useState(0);

  const channelRef = useMemoFirebase(() => doc(firestore, 'channels', channelId), [firestore, channelId]);
  const podcastsQuery = useMemoFirebase(
    () => query(collection(firestore, 'podcasts'), where('channelId', '==', channelId), orderBy('createdAt', 'desc')),
    [firestore, channelId]
  );

  const { data: channel, isLoading: channelLoading } = useDoc<Channel>(channelRef);
  const { data: channelPodcasts, isLoading: podcastsLoading } = useCollection<Podcast>(podcastsQuery);

  const currentPodcast = useMemo(() => {
    if (!channelPodcasts || channelPodcasts.length === 0) return null;
    if (!currentPodcastId) return channelPodcasts[0];
    return channelPodcasts.find((podcast) => podcast.id === currentPodcastId) || channelPodcasts[0];
  }, [channelPodcasts, currentPodcastId]);

  if (channelLoading || podcastsLoading) return <ChannelPageSkeleton />;
  if (!channel) notFound();

  const handleSelectPodcast = (podcastId: string) => {
    setCurrentPodcastId(podcastId);
    setPlayerKey((prev) => prev + 1);
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader hideCategoryNav={true} />
      <main className="flex-1">
        <section className="w-full py-12 md:py-16 lg:py-20 bg-card/50 border-b">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <Avatar className="w-24 h-24 mb-4">
                {channel.logoUrl ? <AvatarImage src={channel.logoUrl} alt={channel.name} /> : <Tv className="p-2 w-full h-full" />}
                <AvatarFallback>{channel.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">{channel.name}</h1>
              <div className="mx-auto max-w-[700px] text-sm text-card-foreground/80">
                <p className="line-clamp-1">{channel.description}</p>
                <Button variant="link" className="p-0 h-auto" onClick={() => setIsDescriptionOpen(true)}>
                  read more
                </Button>
              </div>
              <Link href="/podcast/channels" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" />
                All Podcast Channels
              </Link>
            </div>
          </div>
        </section>

        <section className="w-full py-8 md:py-12 border-b">
          <div className="container px-4 md:px-6">
            {currentPodcast ? (
              <PodcastPlayer podcast={currentPodcast} playerKey={String(playerKey)} playing={true} />
            ) : (
              <div className="text-center py-16">
                <h2 className="text-2xl font-semibold">No Podcasts Yet</h2>
                <p className="text-muted-foreground mt-2">This channel has not uploaded any podcasts yet.</p>
              </div>
            )}
          </div>
        </section>

        {channelPodcasts && channelPodcasts.length > 0 && (
          <section className="w-full py-12 md:py-16">
            <div className="container px-4 md:px-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Mic className="h-5 w-5 text-primary" />
                Channel Podcasts
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {channelPodcasts.map((podcast) => {
                  const isCurrent = podcast.id === currentPodcast?.id;
                  let createdAt = '';
                  try {
                    createdAt = formatDistanceToNow(toDate(podcast.createdAt));
                  } catch {}

                  return (
                    <Card
                      key={podcast.id}
                      className={`overflow-hidden cursor-pointer transition-all duration-200 ${isCurrent ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                      onClick={() => handleSelectPodcast(podcast.id)}
                    >
                      <div className="relative aspect-video">
                        <Image src={podcast.thumbnailUrl} alt={podcast.title} fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <PlayCircle className="h-10 w-10 text-white/90" fill="currentColor" />
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold line-clamp-2">{podcast.title}</h3>
                        {createdAt && <p className="text-xs text-muted-foreground mt-1">{createdAt} ago</p>}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <Dialog open={isDescriptionOpen} onOpenChange={setIsDescriptionOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{channel.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-6 text-sm" style={{ whiteSpace: 'pre-wrap' }}>
            {channel.description}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
