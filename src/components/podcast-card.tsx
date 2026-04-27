'use client';

import Image from 'next/image';
import { PlayCircle, Mic, Radio, Youtube, Video } from 'lucide-react';
import type { Podcast } from '../lib/types';
import { Timestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';

interface PodcastCardProps {
  podcast: Podcast;
  isPlaying?: boolean;
  onClick: (podcast: Podcast) => void;
}

const toDate = (ts: Timestamp | Date | string): Date => {
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts && typeof (ts as any).seconds === 'number') return new Date((ts as any).seconds * 1000);
  return new Date(ts as string);
};

const TypeBadge = ({ type }: { type: Podcast['contentType'] }) => {
  const config = {
    audio: { icon: <Mic className="h-3 w-3" />, label: 'Podcast' },
    video: { icon: <Video className="h-3 w-3" />, label: 'Video' },
    facebook: { icon: <Radio className="h-3 w-3" />, label: 'Facebook Live' },
    youtube: { icon: <Youtube className="h-3 w-3" />, label: 'YouTube' },
  };
  const { icon, label } = config[type] ?? config.audio;
  return (
    <span className="flex items-center gap-1 text-xs font-bold text-white bg-primary/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
      {icon}
      {label}
    </span>
  );
};

export function PodcastCard({ podcast, isPlaying, onClick }: PodcastCardProps) {
  const categoryLabel = podcast.contentCategory || 'My Headlines';
  let timeAgo = '';
  try {
    timeAgo = formatDistanceToNow(toDate(podcast.createdAt));
  } catch {}

  return (
    <div
      onClick={() => onClick(podcast)}
      className={cn(
        'group relative cursor-pointer rounded-xl overflow-hidden select-none',
        'transition-all duration-300 hover:scale-[1.04] hover:shadow-2xl hover:z-10',
        isPlaying && 'ring-2 ring-primary shadow-lg shadow-primary/20 scale-[1.02]'
      )}
    >
      <div className="aspect-video relative bg-muted">
        <Image
          src={podcast.thumbnailUrl}
          alt={podcast.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 280px"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

        {/* Hover play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-primary/90 rounded-full p-3 backdrop-blur-sm shadow-xl">
            <PlayCircle className="h-8 w-8 text-white fill-white" />
          </div>
        </div>

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <TypeBadge type={podcast.contentType} />
        </div>

        {/* Category badge */}
        <div className="absolute top-2 left-[88px] max-w-[50%]">
          <span className="inline-flex items-center rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-semibold text-white/90 backdrop-blur-sm truncate">
            {categoryLabel}
          </span>
        </div>

        {/* Now playing badge */}
        {isPlaying && (
          <div className="absolute top-2 right-2">
            <span className="flex items-center gap-1 text-xs font-bold text-white bg-green-600/90 backdrop-blur-sm px-2 py-0.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              Playing
            </span>
          </div>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-sm font-semibold text-white line-clamp-2 [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
            {podcast.title}
          </p>
          {timeAgo && (
            <p className="text-xs text-white/60 mt-0.5">{timeAgo} ago</p>
          )}
        </div>
      </div>
    </div>
  );
}
