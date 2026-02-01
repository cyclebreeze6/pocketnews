'use client';

import React from 'react';
import ReactPlayer from 'react-player/lazy';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

interface VideoPlayerProps {
  youtubeId?: string;
  videoUrl?: string;
  onEnd?: () => void;
  playing?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export function VideoPlayer({ youtubeId, videoUrl, onEnd, playing = true, onNext, onPrevious, hasNext, hasPrevious }: VideoPlayerProps) {
  const url = youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : videoUrl;
  
  if (!url) {
    return <div className="w-full h-full bg-black flex items-center justify-center text-white">Video not available</div>
  }

  return (
    <div
      className="relative w-full h-full bg-black overflow-hidden group"
    >
      <ReactPlayer
        url={url}
        playing={playing}
        controls={true}
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
      <div className="absolute top-1/2 left-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button onClick={onPrevious} disabled={!hasPrevious} size="icon" variant="ghost" className="text-white hover:bg-white/20 hover:text-white rounded-full h-12 w-12">
          <ArrowLeft className="h-8 w-8" />
        </Button>
      </div>
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button onClick={onNext} disabled={!hasNext} size="icon" variant="ghost" className="text-white hover:bg-white/20 hover:text-white rounded-full h-12 w-12">
          <ArrowRight className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
}
