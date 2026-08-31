'use client';

import { useState } from 'react';
import { X, Maximize2, Tv, Film } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import Image from 'next/image';
import type { Video, IptvChannel } from '../lib/types';
import { VideoPlayer } from './video-player';
import { IptvPlayer } from './iptv-player';

interface FloatingPlayerProps {
  type: 'video' | 'iptv';
  video?: Video | null;
  iptvChannel?: IptvChannel | null;
  isOpen: boolean;
  onClose: () => void;
  onExpand: () => void;
}

export function FloatingPlayer({
  type,
  video,
  iptvChannel,
  isOpen,
  onClose,
  onExpand,
}: FloatingPlayerProps) {
  if (!isOpen || (!video && !iptvChannel)) return null;

  const title = type === 'video' ? video?.title : iptvChannel?.name;
  const logoUrl = type === 'iptv' ? iptvChannel?.logoUrl : null;

  return (
    <div
      className={cn(
        'fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[9999] transition-all duration-300 ease-out shadow-2xl rounded-2xl overflow-hidden border border-cyan-500/30 bg-background/95 backdrop-blur-md group w-72 h-44 sm:w-96 sm:h-56 ring-1 ring-cyan-500/20'
      )}
    >
      {/* Header overlay controls */}
      <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-black/90 via-black/50 to-transparent z-30 px-3 flex items-center justify-between opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 truncate max-w-[70%]">
          {logoUrl ? (
            <div className="relative w-4 h-4 rounded overflow-hidden flex-shrink-0 bg-black/40">
              <Image src={logoUrl} alt="" fill className="object-contain" />
            </div>
          ) : type === 'iptv' ? (
            <Tv className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          ) : (
            <Film className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          )}
          <span className="text-xs font-semibold text-white truncate drop-shadow">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={onExpand}
            title="Expand to main player"
            className="h-7 w-7 text-white hover:bg-white/20 rounded-full"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            title="Close mini player"
            className="h-7 w-7 text-white hover:bg-white/20 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Video Content */}
      <div className="w-full h-full relative">
        {type === 'video' && video ? (
          <VideoPlayer
            youtubeId={video.youtubeVideoId}
            videoUrl={video.videoUrl}
            playing={true}
          />
        ) : type === 'iptv' && iptvChannel ? (
          <IptvPlayer
            channel={iptvChannel}
          />
        ) : null}
      </div>
    </div>
  );
}
