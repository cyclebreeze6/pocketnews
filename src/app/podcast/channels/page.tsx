'use client';

import Link from 'next/link';
import SiteHeader from '../../../components/site-header';
import { Card } from '../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { useCollection, useFirebase, useMemoFirebase } from '../../../firebase';
import type { Channel, Podcast } from '../../../lib/types';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Tv, Mic } from 'lucide-react';

export default function PodcastChannelsPage() {
  const { firestore } = useFirebase();

  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const podcastsQuery = useMemoFirebase(
    () => query(collection(firestore, 'podcasts'), orderBy('createdAt', 'desc'), limit(200)),
    [firestore]
  );

  const { data: channels, isLoading: channelsLoading } = useCollection<Channel>(channelsQuery);
  const { data: podcasts, isLoading: podcastsLoading } = useCollection<Podcast>(podcastsQuery);

  if (channelsLoading || podcastsLoading) {
    return <div>Loading podcast channels...</div>;
  }

  const channelPodcastCount = new Map<string, number>();
  for (const podcast of podcasts || []) {
    if (!podcast.channelId) continue;
    channelPodcastCount.set(podcast.channelId, (channelPodcastCount.get(podcast.channelId) || 0) + 1);
  }

  const podcastChannels = (channels || [])
    .filter((channel) => channelPodcastCount.has(channel.id))
    .sort((a, b) => (channelPodcastCount.get(b.id) || 0) - (channelPodcastCount.get(a.id) || 0));

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader hideCategoryNav={true} />
      <main className="flex-1 py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="flex items-center gap-2 mb-8">
            <Mic className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">Podcast Channels</h1>
          </div>

          {podcastChannels.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-semibold">No Podcast Channels Yet</h2>
              <p className="text-muted-foreground mt-2">Channels with podcast uploads will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {podcastChannels.map((channel) => (
                <Link href={`/podcast/channels/${channel.id}`} key={channel.id} className="group">
                  <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full">
                    <div className="flex flex-col items-center justify-center p-6 text-center h-full">
                      <Avatar className="w-20 h-20 mb-4">
                        {channel.logoUrl ? <AvatarImage src={channel.logoUrl} alt={channel.name} /> : <Tv className="p-2 w-full h-full" />}
                        <AvatarFallback>{channel.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-lg group-hover:text-primary">{channel.name}</h3>
                      <p className="text-xs text-primary mt-2">
                        {channelPodcastCount.get(channel.id) || 0} podcast episode(s)
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{channel.description}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
