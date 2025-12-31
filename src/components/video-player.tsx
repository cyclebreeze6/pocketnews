'use client';

import { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import type { YouTubePlayer } from 'react-youtube';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { Slider } from './ui/slider';
import { cn } from '../lib/utils';

interface VideoPlayerProps {
  youtubeId: string;
  onEnd?: () => void;
}

export function VideoPlayer({ youtubeId, onEnd }: VideoPlayerProps) {
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const onReady = (event: { target: YouTubePlayer }) => {
    setPlayer(event.target);
    if (event.target) {
      event.target.playVideo();
    }
  };

  const onStateChange = (event: { data: number }) => {
    // 0 = ended, 1 = playing, 2 = paused
    if (event.data === 0) { // Video ended
        if (onEnd) {
            onEnd();
        }
    }
  };

  const toggleMute = () => {
    if (!player) return;
    const currentlyMuted = player.isMuted();
    if (currentlyMuted) {
      player.unMute();
    } else {
      player.mute();
    }
    setIsMuted(!currentlyMuted);
  };

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0, // Hide default controls
      rel: 0,
      modestbranding: 1,
      showinfo: 0,
      playsinline: 1, // Important for mobile browsers
    },
  };

  return (
    <div
      className="relative w-full h-full bg-black overflow-hidden group"
      onDoubleClick={toggleMute}
    >
      <YouTube
        videoId={youtubeId}
        opts={opts}
        onReady={onReady}
        onStateChange={onStateChange}
        className="absolute top-0 left-0 w-full h-full"
      />
    </div>
  );
}
