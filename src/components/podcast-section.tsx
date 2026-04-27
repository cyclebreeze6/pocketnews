'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useCollection, useFirebase, useMemoFirebase } from '../firebase';
import type { Podcast, Channel } from '../lib/types';
import { PodcastPlayer } from './podcast-player';
import { PodcastCard } from './podcast-card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { Skeleton } from './ui/skeleton';
import { Mic, Radio } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';

interface PodcastSectionProps {
  isActive: boolean;
  categoryFilter?: string;
}

const toDate = (ts: Timestamp | Date | string): Date => {
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts && typeof (ts as any).seconds === 'number') return new Date((ts as any).seconds * 1000);
  return new Date(ts as string);
};

function PodcastSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Skeleton className="w-full rounded-xl" style={{ minHeight: 340 }} />
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="flex-shrink-0 w-64 aspect-video rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PodcastSection({ isActive, categoryFilter = 'My Headlines' }: PodcastSectionProps) {
  const { firestore } = useFirebase();

  const podcastsQuery = useMemoFirebase(
    () => query(collection(firestore, 'podcasts'), orderBy('createdAt', 'desc'), limit(30)),
    [firestore]
  );
  const { data: podcasts, isLoading } = useCollection<Podcast>(podcastsQuery);
  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const { data: channels } = useCollection<Channel>(channelsQuery);

  const [currentPodcast, setCurrentPodcast] = useState<Podcast | null>(null);
  // Increment this key whenever we want to force-restart the player
  const [playerKey, setPlayerKey] = useState(0);

  const filteredPodcasts = useMemo(() => {
    if (!podcasts) return [];
    if (!categoryFilter || categoryFilter === 'My Headlines') return podcasts;
    return podcasts.filter((podcast) => podcast.contentCategory === categoryFilter);
  }, [podcasts, categoryFilter]);

  // Auto-select and play the first podcast whenever the tab becomes active
  useEffect(() => {
    if (isActive && filteredPodcasts.length > 0) {
      if (!currentPodcast || !filteredPodcasts.some((podcast) => podcast.id === currentPodcast.id)) {
        setCurrentPodcast(filteredPodcasts[0]);
      }
      // Restart the player each time the tab is activated
      setPlayerKey((k) => k + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, filteredPodcasts, currentPodcast]);

  // Once we have podcasts loaded, pre-select the first one
  useEffect(() => {
    if (filteredPodcasts.length === 0) {
      setCurrentPodcast(null);
      return;
    }

    const hasCurrent = currentPodcast && filteredPodcasts.some((podcast) => podcast.id === currentPodcast.id);
    if (!hasCurrent) {
      setCurrentPodcast(filteredPodcasts[0]);
    }
  }, [filteredPodcasts, currentPodcast]);

  const handleSelectPodcast = useCallback((podcast: Podcast) => {
    setCurrentPodcast(podcast);
    setPlayerKey((k) => k + 1);
    // Scroll to top of section
    if (typeof window !== 'undefined') {
      const el = document.getElementById('podcast-featured-player');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  if (isLoading) return <PodcastSkeleton />;

  if (!filteredPodcasts || filteredPodcasts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mic className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">No Podcasts Yet</h2>
          <p className="text-muted-foreground max-w-sm">
            {categoryFilter === 'My Headlines'
              ? 'Podcast episodes will appear here once creators start uploading.'
              : `No podcast episodes found in ${categoryFilter}.`}
          </p>
        </div>
      </div>
    );
  }

  let featuredTimeAgo = '';
  try {
    if (currentPodcast) {
      featuredTimeAgo = formatDistanceToNow(toDate(currentPodcast.createdAt));
    }
  } catch {}

  const featuredChannel = currentPodcast?.channelId
    ? channels?.find((channel) => channel.id === currentPodcast.channelId)
    : null;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* ── Featured / Currently Playing ─────────────────────────── */}
      <div id="podcast-featured-player" className="w-full bg-gradient-to-b from-black/20 to-transparent pt-6 pb-2">
        <div className="container mx-auto px-4 md:px-6">
          {/* Section label */}
          <div className="flex items-center gap-2 mb-4">
            <Radio className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Now Playing
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Player */}
            <div className="lg:col-span-2">
              {currentPodcast && (
                <PodcastPlayer
                  podcast={currentPodcast}
                  playing={isActive}
                  playerKey={String(playerKey)}
                />
              )}
            </div>

            {/* Info panel */}
            {currentPodcast && (
              <div className="lg:col-span-1 flex flex-col justify-center gap-3 px-2">
                <div className="space-y-2">
                  <h2 className="text-xl md:text-2xl font-bold font-headline line-clamp-3">
                    {currentPodcast.title}
                  </h2>
                  {currentPodcast.description && (
                    <p className="text-sm text-muted-foreground line-clamp-4">
                      {currentPodcast.description}
                    </p>
                  )}
                  {featuredTimeAgo && (
                    <p className="text-xs text-muted-foreground">{featuredTimeAgo} ago</p>
                  )}
                  {featuredChannel && (
                    <Link
                      href={`/podcast/channels/${featuredChannel.id}`}
                      className="inline-flex text-xs text-primary hover:underline"
                    >
                      {featuredChannel.name}
                    </Link>
                  )}
                </div>

                {/* Up-next mini list */}
                <div className="mt-4 space-y-2 hidden lg:block">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Up Next
                  </p>
                  {filteredPodcasts.slice(0, 5).map((p) => {
                    const isSelected = p.id === currentPodcast.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPodcast(p)}
                        className={`w-full text-left flex items-center gap-2 p-2 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-card/80 text-foreground'
                        }`}
                      >
                        {isSelected && (
                          <span className="flex h-2 w-2 flex-shrink-0">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                          </span>
                        )}
                        <span className="text-xs font-medium line-clamp-2">{p.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Netflix-style Carousel ────────────────────────────────── */}
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Recent Episodes
          </h3>
          <Link href="/podcast/channels" className="text-sm text-primary hover:underline">
            Browse Podcast Channels
          </Link>
        </div>

        <Carousel
          opts={{ align: 'start', dragFree: true }}
          className="w-full"
        >
          <CarouselContent className="-ml-3">
            {filteredPodcasts.map((podcast) => (
              <CarouselItem
                key={podcast.id}
                className="pl-3 basis-4/5 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
              >
                <PodcastCard
                  podcast={podcast}
                  isPlaying={podcast.id === currentPodcast?.id}
                  onClick={handleSelectPodcast}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="-left-4 bg-background/80 backdrop-blur-sm" />
            <CarouselNext className="-right-4 bg-background/80 backdrop-blur-sm" />
          </div>
        </Carousel>
      </div>
    </div>
  );
}
