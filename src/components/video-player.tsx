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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isShowingControls, setIsShowingControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clean up interval on component unmount
    const interval = setInterval(() => {
      if (player && typeof player.getCurrentTime === 'function') {
        const elapsed = player.getCurrentTime();
        const total = player.getDuration();
        setCurrentTime(elapsed);
        if (total > 0) {
          setDuration(total);
          setProgress((elapsed / total) * 100);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [player]);
  
  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const hideControls = () => {
    if (isPlaying) {
      setIsShowingControls(false);
    }
  };

  const showControls = () => {
    setIsShowingControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(hideControls, 3000);
  };
  
  const onReady = (event: { target: YouTubePlayer }) => {
    setPlayer(event.target);
    setIsPlayerReady(true);
    event.target.playVideo();
  };

  const onStateChange = (event: { data: number }) => {
    // 0 = ended, 1 = playing, 2 = paused
    if (event.data === 0) { // Video ended
        if (onEnd) {
            onEnd();
        }
    }
    else if (event.data === 1) { // Playing
      setIsPlaying(true);
      showControls();
    } else { // Paused or other states
      setIsPlaying(false);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      setIsShowingControls(true);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      player?.pauseVideo();
    } else {
      player?.playVideo();
    }
  };
  
  const toggleMute = () => {
      if(isMuted) {
          player?.unMute();
      } else {
          player?.mute();
      }
      setIsMuted(!isMuted);
  }

  const handleSeek = (value: number[]) => {
    const newTime = (value[0] / 100) * duration;
    player?.seekTo(newTime, true);
    setProgress(value[0]);
  };
  
  const handleFullscreen = () => {
    const elem = playerContainerRef.current;
    if (!elem) return;

    if (!isFullscreen) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } 
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const floor = Math.floor(timeInSeconds);
    const hours = Math.floor(floor / 3600);
    const minutes = Math.floor((floor % 3600) / 60);
    const seconds = floor % 60;
    
    const parts = [];
    if (hours > 0) parts.push(hours);
    parts.push(minutes.toString().padStart(hours > 0 ? 2 : 1, '0'));
    parts.push(seconds.toString().padStart(2, '0'));
    
    return parts.join(':');
  }

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0, // Hide default controls
      rel: 0,
      modestbranding: 1,
      showinfo: 0,
    },
  };

  return (
    <div
      ref={playerContainerRef}
      className="relative w-full h-full aspect-video bg-black overflow-hidden group"
      onMouseMove={showControls}
      onMouseLeave={hideControls}
    >
      <YouTube
        videoId={youtubeId}
        opts={opts}
        onReady={onReady}
        onStateChange={onStateChange}
        className="absolute top-0 left-0 w-full h-full"
      />
      
      {!isPlaying && isPlayerReady && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
            <button onClick={togglePlay} className="p-4 bg-black/50 rounded-full text-white hover:bg-primary transition-colors">
                <Play className="h-16 w-16" fill="currentColor" />
            </button>
        </div>
      )}

      <div className={cn(
          "absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300",
          isShowingControls ? 'opacity-100' : 'opacity-0'
      )}>
        <div className="flex items-center gap-4 text-white">
            <button onClick={togglePlay}>
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </button>
            <div className="flex-grow flex items-center gap-2">
                <span className="text-xs font-mono">{formatTime(currentTime)}</span>
                <Slider
                    value={[progress]}
                    max={100}
                    step={1}
                    onValueChange={handleSeek}
                    className="w-full"
                />
                <span className="text-xs font-mono">{formatTime(duration)}</span>
            </div>
             <button onClick={toggleMute}>
                {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </button>
            <button onClick={handleFullscreen}>
                {isFullscreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
            </button>
        </div>
      </div>
    </div>
  );
}
