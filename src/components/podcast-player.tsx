'use client';

import React from 'react';
import ReactPlayer from 'react-player/lazy';
import Image from 'next/image';
import { Mic } from 'lucide-react';
import type { Podcast } from '../lib/types';

interface PodcastPlayerProps {
  podcast: Podcast;
  playing?: boolean;
  playerKey?: string;
}

export function PodcastPlayer({ podcast, playing = true, playerKey }: PodcastPlayerProps) {
  const isAudio = podcast.contentType === 'audio';

  let playerUrl: string | undefined;
  if (podcast.contentType === 'youtube' && podcast.youtubeVideoId) {
    playerUrl = `https://www.youtube.com/watch?v=${podcast.youtubeVideoId}`;
  } else if (podcast.contentType === 'facebook' && podcast.facebookLiveUrl) {
    playerUrl = podcast.facebookLiveUrl;
  } else if (podcast.contentType === 'video' && podcast.videoUrl) {
    playerUrl = podcast.videoUrl;
  } else if (isAudio && podcast.audioUrl) {
    playerUrl = podcast.audioUrl;
  }

  if (!playerUrl) {
    return (
      <div className="w-full aspect-video bg-muted rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No media available</p>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden" style={{ minHeight: 340 }}>
        {/* Blurred background */}
        <div className="absolute inset-0">
          <Image
            src={podcast.thumbnailUrl}
            alt=""
            fill
            className="object-cover blur-2xl scale-110 opacity-30"
            aria-hidden
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        {/* Foreground content */}
        <div
          className="relative flex flex-col items-center justify-center gap-5 px-6 py-8"
          style={{ minHeight: 340 }}
        >
          {/* Circular album art */}
          <div className="relative w-36 h-36 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/10 flex-shrink-0">
            <Image
              src={podcast.thumbnailUrl}
              alt={podcast.title}
              fill
              className="object-cover"
            />
          </div>

          {/* Meta */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-primary">
              <Mic className="h-3.5 w-3.5" />
              PODCAST
            </div>
            <p className="text-white font-bold text-lg line-clamp-2 max-w-sm">
              {podcast.title}
            </p>
            {podcast.description && (
              <p className="text-white/60 text-xs line-clamp-2 max-w-xs">
                {podcast.description}
              </p>
            )}
          </div>

          {/* Audio player bar */}
          <div className="w-full max-w-sm">
            <ReactPlayer
              key={playerKey}
              url={playerUrl}
              playing={playing}
              controls
              width="100%"
              height="54px"
              config={{ file: { forceAudio: true, attributes: { controlsList: 'nodownload' } } }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Video / YouTube / Facebook Live
  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
      <ReactPlayer
        key={playerKey}
        url={playerUrl}
        playing={playing}
        controls
        width="100%"
        height="100%"
        className="absolute top-0 left-0"
        config={{
          youtube: {
            playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
          },
          facebook: { appId: '' },
          file: { attributes: {} },
        }}
      />
    </div>
  );
}
