'use client';

import React from 'react';
import ReactPlayer from 'react-player/lazy';
import { ArrowLeft, ArrowRight, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface VideoPlayerProps {
  youtubeId?: string;
  videoUrl?: string;
  onEnd?: () => void;
  playing?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  isTheaterMode?: boolean;
  onToggleTheater?: () => void;
}

export function VideoPlayer({ 
  youtubeId, 
  videoUrl, 
  onEnd, 
  playing = true, 
  onNext, 
  onPrevious, 
  hasNext, 
  hasPrevious,
  isTheaterMode,
  onToggleTheater
}: VideoPlayerProps) {
  const url = youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : videoUrl;
  
  if (!url) {
    return <div className="w-full h-full bg-black flex items-center justify-center text-white">Video not available</div>
  }

  return (
    <div
      className={cn(
        "relative w-full h-full bg-black overflow-hidden group transition-all duration-300",
        isTheaterMode && "rounded-none"
      )}
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
      
      {/* Navigation Controls Overlay */}
      <div className="absolute top-1/2 left-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
        <Button 
          onClick={onPrevious} 
          disabled={!hasPrevious} 
          size="icon" 
          variant="ghost" 
          className="text-white hover:bg-white/20 hover:text-white rounded-full h-12 w-12"
        >
          <ArrowLeft className="h-8 w-8" />
        </Button>
      </div>
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
        <Button 
          onClick={onNext} 
          disabled={!hasNext} 
          size="icon" 
          variant="ghost" 
          className="text-white hover:bg-white/20 hover:text-white rounded-full h-12 w-12"
        >
          <ArrowRight className="h-8 w-8" />
        </Button>
      </div>

      {/* Theater Mode Toggle Button */}
      {onToggleTheater && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex gap-2">
          <Button 
            onClick={onToggleTheater} 
            size="icon" 
            variant="ghost" 
            className="text-white bg-black/40 hover:bg-black/60 rounded-md h-10 w-10 border border-white/10"
            title={isTheaterMode ? "Exit Theater Mode" : "Theater Mode"}
          >
            {isTheaterMode ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
        </div>
      )}
    </div>
  );
}
