'use client';

import React, { useState } from 'react';
import ReactPlayer from 'react-player/lazy';
import { cn } from '../lib/utils';

interface VideoPlayerProps {
  youtubeId?: string;
  videoUrl?: string;
  onEnd?: () => void;
  playing?: boolean;
}

export function VideoPlayer({ youtubeId, videoUrl, onEnd, playing = true }: VideoPlayerProps) {
  const [isMuted, setIsMuted] = useState(false);

  const url = youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : videoUrl;

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  if (!url) {
    return <div className="w-full h-full bg-black flex items-center justify-center text-white">Video not available</div>
  }

  return (
    <div
      className="relative w-full h-full bg-black overflow-hidden group"
      onDoubleClick={toggleMute}
    >
      <ReactPlayer
        url={url}
        playing={playing}
        controls={false}
        muted={isMuted}
        onEnded={onEnd}
        width="100%"
        height="100%"
        className="absolute top-0 left-0"
        config={{
            youtube: {
                playerVars: {
                    playsinline: 1,
                    showinfo: 0,
                    rel: 0,
                    modestbranding: 1,
                    origin: typeof window !== 'undefined' ? window.location.origin : '',
                }
            },
            file: {
              attributes: {
                // Add attributes to the video element if needed
              }
            }
        }}
      />
    </div>
  );
}
