'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player/lazy';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Maximize2, 
  Minimize2, 
  RotateCcw,
  RotateCw,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
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
  className?: string;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;

  if (hours > 0) {
    return `${hours}:${remMins < 10 ? '0' : ''}${remMins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
  onToggleTheater,
  className
}: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(playing);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasClickedPlay, setHasClickedPlay] = useState(false);

  // Sync external playing prop
  useEffect(() => {
    setIsPlaying(playing);
  }, [playing]);

  const url = youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : videoUrl;

  // Auto hide controls on inactivity
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
    setHasClickedPlay(true);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
  };

  const handleProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
    if (!isSeeking) {
      setPlayed(state.played);
      setCurrentTime(state.playedSeconds);
    }
    setLoaded(state.loaded);
  };

  const handleDuration = (dur: number) => {
    setDuration(dur);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setPlayed(val);
    setCurrentTime(val * duration);
  };

  const handleSeekMouseDown = () => {
    setIsSeeking(true);
  };

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    setIsSeeking(false);
    const val = parseFloat((e.target as HTMLInputElement).value);
    if (playerRef.current) {
      playerRef.current.seekTo(val, 'fraction');
    }
  };

  const handleRewind = () => {
    if (playerRef.current) {
      const newTime = Math.max(0, currentTime - 10);
      playerRef.current.seekTo(newTime, 'seconds');
      setCurrentTime(newTime);
      setPlayed(duration > 0 ? newTime / duration : 0);
    }
  };

  const handleFastForward = () => {
    if (playerRef.current) {
      const newTime = Math.min(duration, currentTime + 10);
      playerRef.current.seekTo(newTime, 'seconds');
      setCurrentTime(newTime);
      setPlayed(duration > 0 ? newTime / duration : 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    } else {
      containerRef.current.requestFullscreen().catch(console.error);
    }
  };

  if (!url) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center text-white font-medium">
        Video not available
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={cn(
        "relative w-full h-full bg-black overflow-hidden group select-none transition-all duration-300",
        isTheaterMode && "rounded-none",
        className
      )}
    >
      {/* Scaled/Cropped YouTube Frame (Removes all YouTube logos, titles, and branding) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[7%] -bottom-[7%] -left-[1%] -right-[1%] w-[102%] h-[114%] transform scale-[1.07] pointer-events-auto">
          <ReactPlayer
            ref={playerRef}
            url={url}
            playing={isPlaying}
            controls={false}
            volume={isMuted ? 0 : volume}
            muted={isMuted}
            onProgress={handleProgress}
            onDuration={handleDuration}
            onEnded={onEnd}
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0 }}
            config={{
              youtube: {
                playerVars: {
                  controls: 0,
                  modestbranding: 1,
                  rel: 0,
                  showinfo: 0,
                  iv_load_policy: 3,
                  fs: 0,
                  disablekb: 1,
                  autohide: 1,
                  origin: typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://pocketstream.tv',
                }
              }
            }}
          />
        </div>
      </div>

      {/* Click Overlay to toggle Play/Pause */}
      <div 
        onClick={togglePlay} 
        className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center"
      >
        {/* Animated Play/Pause indicator when paused */}
        {!isPlaying && (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl transition-transform duration-200 transform hover:scale-110">
            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current translate-x-0.5" />
          </div>
        )}
      </div>

      {/* Top Controls Bar (Theater Mode Toggle & Channel Nav) */}
      <div className={cn(
        "absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between z-20 transition-opacity duration-300 pointer-events-auto",
        showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className="flex items-center gap-2">
          {onPrevious && (
            <Button
              onClick={(e) => { e.stopPropagation(); onPrevious(); }}
              disabled={!hasPrevious}
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20 rounded-full h-9 w-9 disabled:opacity-30"
              title="Previous Video"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {onNext && (
            <Button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              disabled={!hasNext}
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20 rounded-full h-9 w-9 disabled:opacity-30"
              title="Next Video"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </div>

        {onToggleTheater && (
          <Button 
            onClick={(e) => { e.stopPropagation(); onToggleTheater(); }} 
            size="icon" 
            variant="ghost" 
            className="text-white bg-black/40 hover:bg-black/60 rounded-md h-9 w-9 border border-white/10"
            title={isTheaterMode ? "Exit Theater Mode" : "Theater Mode"}
          >
            {isTheaterMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Bottom Glassmorphic Control Bar (Custom Seekbar, Controls & Volume) */}
      <div className={cn(
        "absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col gap-2 z-20 transition-opacity duration-300 pointer-events-auto",
        showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        {/* Interactive Scrub Bar / Timeline */}
        <div className="relative w-full flex items-center group/slider">
          <input
            type="range"
            min={0}
            max={1}
            step="0.001"
            value={played}
            onChange={handleSeekChange}
            onMouseDown={handleSeekMouseDown}
            onMouseUp={handleSeekMouseUp}
            className="w-full h-1.5 hover:h-2.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary transition-all duration-150 relative z-10"
            style={{
              background: `linear-gradient(to right, #06b6d4 ${played * 100}%, rgba(255, 255, 255, 0.3) ${played * 100}%, rgba(255, 255, 255, 0.2) ${loaded * 100}%, rgba(255, 255, 255, 0.1) 100%)`
            }}
          />
        </div>

        {/* Buttons & Time Row */}
        <div className="flex items-center justify-between text-white text-xs sm:text-sm pt-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="text-white hover:bg-white/20 h-9 w-9 rounded-full"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); handleRewind(); }}
              className="text-white hover:bg-white/20 h-8 w-8 rounded-full hidden sm:flex"
              title="Rewind 10s"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); handleFastForward(); }}
              className="text-white hover:bg-white/20 h-8 w-8 rounded-full hidden sm:flex"
              title="Forward 10s"
            >
              <RotateCw className="h-4 w-4" />
            </Button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 group/vol">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                className="text-white hover:bg-white/20 h-8 w-8 rounded-full"
              >
                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
              </Button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20 h-1 rounded-lg accent-primary cursor-pointer bg-white/30"
              />
            </div>

            {/* Time Stamp */}
            <span className="font-mono text-xs text-white/80 ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
              className="text-white hover:bg-white/20 h-8 w-8 rounded-full"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
