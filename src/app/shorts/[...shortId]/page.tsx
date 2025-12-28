
'use client';

import { useCollection, useFirebase, useMemoFirebase } from '../../../firebase';
import type { Short, Channel } from '../../../lib/types';
import { collection, query, orderBy } from 'firebase/firestore';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { VideoPlayer } from '../../../components/video-player';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import { Home, ChevronUp, ChevronDown, Volume2, VolumeX, Pause, Play, Heart } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import { cn } from '../../../lib/utils';
import Link from 'next/link';

function ShortsSkeleton() {
  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center">
      <Skeleton className="h-full w-full max-w-[450px] aspect-[9/16] bg-neutral-800" />
    </div>
  );
}

const ShortPlayer = ({ short, channel, isVisible, isMuted, toggleMute }: { short: Short, channel: Channel | undefined, isVisible: boolean, isMuted: boolean, toggleMute: () => void }) => {
  return (
    <div className="relative h-full w-full snap-start overflow-hidden">
      <div className={cn("absolute inset-0 transition-opacity duration-500", isVisible ? "opacity-100" : "opacity-0")}>
        {isVisible && <VideoPlayer youtubeId={short.youtubeVideoId} />}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3 className="text-lg font-bold">{short.title}</h3>
        <div className="flex items-center gap-2 mt-2">
          <Avatar>
            <AvatarImage src={channel?.logoUrl} alt={channel?.name} />
            <AvatarFallback>{channel?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <p className="font-semibold">{channel?.name}</p>
        </div>
      </div>
      <div className="absolute top-4 right-4 text-white z-20">
         <Button onClick={toggleMute} variant="ghost" size="icon" className="bg-black/30 hover:bg-black/50">
            {isMuted ? <VolumeX /> : <Volume2 />}
        </Button>
      </div>
       <div className="absolute right-4 bottom-24 text-white z-20 flex flex-col items-center gap-4">
          <Button variant="ghost" size="icon" className="flex flex-col h-auto bg-black/30 hover:bg-black/50">
            <Heart className="h-7 w-7" />
            <span className="text-xs mt-1">{Math.floor(Math.random() * 1000)}</span>
          </Button>
      </div>
    </div>
  );
};


export default function ShortsPage() {
  const { firestore } = useFirebase();
  const router = useRouter();
  const params = useParams();
  const initialShortId = Array.isArray(params.shortId) ? params.shortId[0] : params.shortId;

  const shortsQuery = useMemoFirebase(() => query(collection(firestore, 'shorts'), orderBy('createdAt', 'desc')), [firestore]);
  const { data: shorts, isLoading: shortsLoading } = useCollection<Short>(shortsQuery);
  
  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const { data: channels, isLoading: channelsLoading } = useCollection<Channel>(channelsQuery);

  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isMuted, setIsMuted] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shorts && initialShortId) {
      const index = shorts.findIndex(s => s.id === initialShortId);
      if (index !== -1) {
        setCurrentIndex(index);
      } else if(shorts.length > 0) {
        setCurrentIndex(0); // Fallback to first short
      }
    } else if (shorts && shorts.length > 0) {
        setCurrentIndex(0);
    }
  }, [shorts, initialShortId]);

  const scrollToShort = useCallback((index: number) => {
    const container = containerRef.current;
    if (container && container.children[index]) {
      container.children[index].scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      setCurrentIndex(index);
      const newUrl = `/shorts/${shorts?.[index]?.id}`;
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
    }
  }, [shorts]);

  const handleNext = useCallback(() => {
    if (shorts && currentIndex < shorts.length - 1) {
      scrollToShort(currentIndex + 1);
    }
  }, [currentIndex, shorts, scrollToShort]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      scrollToShort(currentIndex - 1);
    }
  }, [currentIndex, scrollToShort]);
  
   useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    };

    const container = containerRef.current;
    container?.addEventListener('wheel', handleWheel, { passive: false });
    return () => container?.removeEventListener('wheel', handleWheel);
  }, [handleNext, handlePrev]);

  useEffect(() => {
    if (currentIndex !== -1 && containerRef.current?.children[currentIndex]) {
        containerRef.current.children[currentIndex].scrollIntoView({ behavior: 'auto' });
    }
  }, [currentIndex]);


  const toggleMute = () => setIsMuted(prev => !prev);
  
  if (shortsLoading || channelsLoading || currentIndex === -1) {
    return <ShortsSkeleton />;
  }

  return (
    <div className="relative h-screen w-screen bg-black">
      <div ref={containerRef} className="h-full w-full max-w-[450px] mx-auto overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar">
        {shorts?.map((short, index) => (
          <ShortPlayer
            key={short.id}
            short={short}
            channel={channels?.find(c => c.id === short.channelId)}
            isVisible={index === currentIndex}
            isMuted={isMuted}
            toggleMute={toggleMute}
          />
        ))}
      </div>
      
      {/* Desktop Navigation */}
      <Button onClick={handlePrev} variant="secondary" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex rounded-full h-12 w-12 z-20">
        <ChevronUp className="h-6 w-6" />
      </Button>
      <Button onClick={handleNext} variant="secondary" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex rounded-full h-12 w-12 z-20">
        <ChevronDown className="h-6 w-6" />
      </Button>

      {/* Home Button */}
      <Link href="/">
        <Button variant="secondary" size="icon" className="absolute top-4 left-4 rounded-full z-20">
          <Home className="h-5 w-5" />
        </Button>
      </Link>
    </div>
  );
}
