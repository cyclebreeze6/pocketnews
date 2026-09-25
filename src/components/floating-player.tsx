'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Maximize2, Tv, Film, PictureInPicture2, Move } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import Image from 'next/image';
import type { Video, IptvChannel } from '../lib/types';
import { VideoPlayer } from './video-player';
import { IptvPlayer } from './iptv-player';
import { useToast } from '../hooks/use-toast';

interface FloatingPlayerProps {
  type: 'video' | 'iptv';
  video?: Video | null;
  iptvChannel?: IptvChannel | null;
  isOpen: boolean;
  onClose: () => void;
  onExpand: () => void;
  initialTime?: number;
  onProgress?: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
}

export function FloatingPlayer({
  type,
  video,
  iptvChannel,
  isOpen,
  onClose,
  onExpand,
  initialTime = 0,
  onProgress,
}: FloatingPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPipActive, setIsPipActive] = useState(false);
  const { toast } = useToast();

  // Dragging position state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  // Track picture in picture changes
  useEffect(() => {
    const handlePipChange = () => {
      setIsPipActive(!!document.pictureInPictureElement);
    };
    document.addEventListener('enterpictureinpicture', handlePipChange);
    document.addEventListener('leavepictureinpicture', handlePipChange);
    return () => {
      document.removeEventListener('enterpictureinpicture', handlePipChange);
      document.removeEventListener('leavepictureinpicture', handlePipChange);
    };
  }, []);

  const handleTogglePip = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipActive(false);
        return;
      }

      // 1. Try native HTML5 video PiP (HTML5 video or HLS)
      const videoEl = containerRef.current?.querySelector('video');
      if (videoEl && 'requestPictureInPicture' in videoEl) {
        await videoEl.requestPictureInPicture();
        setIsPipActive(true);
        return;
      }

      // 2. Try Chrome / Edge Document Picture-in-Picture API
      if (typeof window !== 'undefined' && 'documentPictureInPicture' in (window as any)) {
        const docPip = (window as any).documentPictureInPicture;
        
        if (docPip.window) {
          docPip.window.close();
          setIsPipActive(false);
          return;
        }

        const pipWindow = await docPip.requestWindow({
          width: 380,
          height: 220,
        });

        // Copy active styles into PiP window safely from document.head
        const styleElements = document.querySelectorAll('style, link[rel="stylesheet"]');
        styleElements.forEach((node) => {
          pipWindow.document.head.appendChild(node.cloneNode(true));
        });

        const pipContainer = pipWindow.document.createElement('div');
        pipContainer.style.width = '100vw';
        pipContainer.style.height = '100vh';
        pipContainer.style.backgroundColor = '#000';
        pipContainer.style.display = 'flex';
        pipContainer.style.alignItems = 'center';
        pipContainer.style.justifyContent = 'center';
        pipWindow.document.body.style.margin = '0';
        pipWindow.document.body.style.overflow = 'hidden';
        pipWindow.document.body.appendChild(pipContainer);

        if (containerRef.current) {
          const clone = containerRef.current.cloneNode(true) as HTMLElement;
          clone.style.position = 'relative';
          clone.style.left = '0';
          clone.style.top = '0';
          clone.style.right = '0';
          clone.style.bottom = '0';
          clone.style.width = '100%';
          clone.style.height = '100%';
          pipContainer.appendChild(clone);
        }

        pipWindow.addEventListener('pagehide', () => {
          setIsPipActive(false);
        });

        setIsPipActive(true);
        return;
      }

      toast({
        title: "Floating Player Active",
        description: "The video mini-player is active on screen.",
      });
    } catch (err: any) {
      console.warn('Picture-in-Picture trigger error:', err);
      toast({
        title: "Picture-in-Picture",
        description: "Floating mini-player is active on screen.",
      });
    }
  };

  // Handle Dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position ? position.x : rect.left,
      initialY: position ? position.y : rect.top,
    };

    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const newX = dragStartRef.current.initialX + deltaX;
    const newY = dragStartRef.current.initialY + deltaY;

    // Boundary constraints
    const maxX = window.innerWidth - (containerRef.current?.offsetWidth || 300);
    const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 200);

    setPosition({
      x: Math.max(10, Math.min(maxX - 10, newX)),
      y: Math.max(10, Math.min(maxY - 10, newY)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (e) {
        // ignore
      }
    }
  };

  if (!isOpen || (!video && !iptvChannel)) return null;

  const title = type === 'video' ? video?.title : iptvChannel?.name;
  const logoUrl = type === 'iptv' ? iptvChannel?.logoUrl : null;

  const stylePosition = position
    ? { left: `${position.x}px`, top: `${position.y}px`, right: 'auto', bottom: 'auto' }
    : {};

  return (
    <div
      ref={containerRef}
      style={stylePosition}
      className={cn(
        'fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[9999] transition-shadow duration-300 ease-out shadow-2xl rounded-2xl overflow-hidden border border-cyan-500/40 bg-background/95 backdrop-blur-md group w-72 h-44 sm:w-96 sm:h-56 ring-1 ring-cyan-500/20 select-none',
        isDragging && 'cursor-grabbing scale-[1.02] shadow-cyan-500/20'
      )}
    >
      {/* Header overlay controls */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-black/90 via-black/60 to-transparent z-30 px-3 flex items-center justify-between opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 truncate max-w-[55%]">
          <Move className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
          {logoUrl ? (
            <div className="relative w-4 h-4 rounded overflow-hidden flex-shrink-0 bg-black/40">
              <Image src={logoUrl} alt="" fill className="object-contain" unoptimized />
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
          {/* PiP button for floating outside browser / APK */}
          <Button
            size="icon"
            variant="ghost"
            onClick={handleTogglePip}
            title={isPipActive ? "Exit System Picture-in-Picture" : "Pop out floating window outside app (PiP)"}
            className={cn(
              "h-7 w-7 rounded-full text-white hover:bg-white/20 transition-colors",
              isPipActive && "text-cyan-400 bg-white/10"
            )}
          >
            <PictureInPicture2 className="h-4 w-4" />
          </Button>

          {/* Expand to main player */}
          <Button
            size="icon"
            variant="ghost"
            onClick={onExpand}
            title="Expand to main player"
            className="h-7 w-7 text-white hover:bg-white/20 rounded-full"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>

          {/* Close floating player */}
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
            initialTime={initialTime}
            onProgress={onProgress}
          />
        ) : type === 'iptv' && iptvChannel ? (
          <IptvPlayer
            channel={iptvChannel}
            active={true}
          />
        ) : null}
      </div>
    </div>
  );
}

