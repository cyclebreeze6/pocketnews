'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Volume2, VolumeX, Play, Pause, Maximize, RefreshCw, Radio, Tv, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import Image from 'next/image';
import type { IptvChannel, EpgProgram } from '../lib/types';
import { cn } from '../lib/utils';

interface IptvPlayerProps {
  channel: IptvChannel;
  currentProgram?: EpgProgram | null;
  onPlayStateChange?: (isPlaying: boolean) => void;
  className?: string;
}

export function IptvPlayer({ channel, currentProgram, onPlayStateChange, className }: IptvPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize HLS player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel.m3u8Url) return;

    setIsLoading(true);
    setError(null);
    setIsPlaying(false);

    // Destroy existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = channel.m3u8Url;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().then(() => {
          setIsPlaying(true);
          if (onPlayStateChange) onPlayStateChange(true);
        }).catch((err) => {
          console.warn('Autoplay prevented:', err);
          setIsPlaying(false);
          if (onPlayStateChange) onPlayStateChange(false);
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('HLS network error, attempting recovery...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('HLS media error, attempting recovery...');
              hls.recoverMediaError();
              break;
            default:
              console.error('Fatal HLS error:', data);
              setError('Stream unavailable or blocked by CORS.');
              setIsLoading(false);
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().then(() => {
          setIsPlaying(true);
          if (onPlayStateChange) onPlayStateChange(true);
        }).catch((err) => {
          console.warn('Safari autoplay prevented:', err);
          setIsPlaying(false);
        });
      });
    } else {
      setError('HLS playback is not supported in this browser.');
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel.m3u8Url, onPlayStateChange]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
    } else {
      video.play().then(() => {
        setIsPlaying(true);
        if (onPlayStateChange) onPlayStateChange(true);
      }).catch((err) => console.error('Play error:', err));
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    } else {
      video.requestFullscreen().catch(err => console.error(err));
    }
  };

  const handleRetry = () => {
    if (videoRef.current && channel.m3u8Url) {
      setError(null);
      setIsLoading(true);
      if (hlsRef.current) {
        hlsRef.current.loadSource(channel.m3u8Url);
        hlsRef.current.startLoad();
      } else {
        videoRef.current.src = channel.m3u8Url;
        videoRef.current.load();
      }
    }
  };

  const isRadio = channel.type === 'radio';

  return (
    <div className={cn("relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group border border-white/10", className)}>
      {/* Video Element */}
      <video
        ref={videoRef}
        className={cn("w-full h-full object-contain", isRadio && "hidden")}
        playsInline
        crossOrigin="anonymous"
      />

      {/* Radio Visualizer Background */}
      {isRadio && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-6 text-center">
          <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-4 border-primary/50 shadow-xl flex items-center justify-center bg-black/40">
            {channel.logoUrl ? (
              <Image src={channel.logoUrl} alt={channel.name} fill className="object-cover" />
            ) : (
              <Radio className="w-12 h-12 text-primary" />
            )}
          </div>
          <Badge variant="outline" className="mb-2 border-primary/40 text-primary bg-primary/10">
            LIVE RADIO STREAM
          </Badge>
          <h2 className="text-2xl font-bold text-white mb-1">{channel.name}</h2>
          {currentProgram && (
            <p className="text-sm text-cyan-300 font-medium line-clamp-1 max-w-md">
              Now Airing: {currentProgram.title}
            </p>
          )}
          {isPlaying && (
            <div className="flex items-center gap-1 mt-4">
              <span className="w-1.5 h-6 bg-primary animate-bounce rounded-full" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-10 bg-cyan-400 animate-bounce rounded-full" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-8 bg-primary animate-bounce rounded-full" style={{ animationDelay: '300ms' }} />
              <span className="w-1.5 h-12 bg-cyan-300 animate-bounce rounded-full" style={{ animationDelay: '450ms' }} />
              <span className="w-1.5 h-7 bg-primary animate-bounce rounded-full" style={{ animationDelay: '200ms' }} />
            </div>
          )}
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white z-20">
          <RefreshCw className="w-10 h-10 animate-spin text-primary mb-3" />
          <p className="text-sm font-medium">Connecting to {channel.name}...</p>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white z-30 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <h3 className="text-lg font-bold mb-1">Stream Error</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">{error}</p>
          <Button variant="outline" size="sm" onClick={handleRetry} className="gap-2 border-white/20">
            <RefreshCw className="w-4 h-4" /> Retry Stream
          </Button>
        </div>
      )}

      {/* Top Banner (Logo & Program details) */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
        <div className="flex items-center gap-3">
          {channel.logoUrl && (
            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-white/20 bg-black/60 flex-shrink-0">
              <Image src={channel.logoUrl} alt={channel.name} fill className="object-contain p-1" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold text-white leading-tight flex items-center gap-2">
              {channel.name}
              <Badge variant="secondary" className="text-[10px] uppercase bg-white/10 text-white border-white/20">
                {channel.category}
              </Badge>
            </h3>
            {currentProgram && (
              <p className="text-xs text-cyan-300 line-clamp-1">
                {currentProgram.title}
              </p>
            )}
          </div>
        </div>

        {/* LIVE Badge */}
        <Badge variant="destructive" className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold shadow-lg animate-pulse">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          LIVE
        </Badge>
      </div>

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/20 h-9 w-9">
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/20 h-8 w-8">
              {isMuted || volume === 0 ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 accent-primary cursor-pointer h-1.5 rounded-lg bg-white/30"
            />
          </div>
        </div>

        {!isRadio && (
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/20 h-9 w-9">
            <Maximize className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
