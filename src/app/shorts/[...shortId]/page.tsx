
'use client';

import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { useCollection, useFirebase, useMemoFirebase, useUser } from '../../../firebase';
import type { Short, Channel } from '../../../lib/types';
import { collection, query, orderBy } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { VideoPlayer } from '../../../components/video-player';
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import { MessageCircle, Share2, Clapperboard, X, ArrowUp, ArrowDown } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import { useToast } from '../../../hooks/use-toast';
import { AuthDialog } from '../../../components/auth-dialog';

function ShortsPlayerSkeleton() {
    return (
        <div className="h-screen w-screen bg-black flex items-center justify-center">
            <Skeleton className="h-full w-full max-w-md aspect-[9/16]" />
        </div>
    )
}

function ShortsPlayerInner() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    
    const shortId = Array.isArray(params.shortId) ? params.shortId[0] : params.shortId;

    const shortsQuery = useMemoFirebase(() => query(collection(firestore, 'shorts'), orderBy('createdAt', 'desc')), [firestore]);
    const { data: shorts, isLoading: shortsLoading } = useCollection<Short>(shortsQuery);
    
    const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
    const { data: channels, isLoading: channelsLoading } = useCollection<Channel>(channelsQuery);
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

    const currentShort = shorts?.[currentIndex];
    
    useEffect(() => {
        if (shorts && shortId) {
            const index = shorts.findIndex(s => s.id === shortId);
            if (index !== -1) {
                setCurrentIndex(index);
            }
        }
    }, [shorts, shortId]);
    
    const currentChannel = channels?.find(c => c.id === currentShort?.channelId);

    const handleNext = useCallback(() => {
        if (shorts && currentIndex < shorts.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            router.replace(`/shorts/${shorts[nextIndex].id}`, { scroll: false });
        }
    }, [currentIndex, shorts, router]);

    const handlePrev = useCallback(() => {
        if (currentIndex > 0 && shorts) {
            const prevIndex = currentIndex - 1;
            setCurrentIndex(prevIndex);
            router.replace(`/shorts/${shorts[prevIndex].id}`, { scroll: false });
        }
    }, [currentIndex, shorts, router]);
    
    const handleShare = async () => {
        if (!currentShort) return;
        const shareUrl = `${window.location.origin}/shorts/${currentShort.id}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: currentShort.title,
                    text: `Check out this short from ${currentChannel?.name}!`,
                    url: shareUrl,
                });
            } catch (error) {
                console.error('Error sharing:', error);
                toast({
                    variant: 'destructive',
                    title: 'Could not share',
                    description: 'Sharing was cancelled or failed.',
                });
            }
        } else {
            // Fallback for browsers that don't support the Web Share API
            navigator.clipboard.writeText(shareUrl);
            toast({
                title: 'Link Copied!',
                description: 'The video link has been copied to your clipboard.',
            });
        }
    };


    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (e.deltaY > 1) handleNext();
            if (e.deltaY < -1) handlePrev();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') handleNext();
            if (e.key === 'ArrowUp') handlePrev();
        };
        
        const container = document.getElementById('shorts-container');

        container?.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            container?.removeEventListener('wheel', handleWheel);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleNext, handlePrev]);
    
    const touchStartY = useRef(0);
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        const touchEndY = e.changedTouches[0].clientY;
        if (touchStartY.current - touchEndY > 50) { // Swiped up
            handleNext();
        } else if (touchEndY - touchStartY.current > 50) { // Swiped down
            handlePrev();
        }
    };


    if (shortsLoading || channelsLoading || !shorts) {
        return <ShortsPlayerSkeleton />;
    }
    
    if (shorts.length === 0) {
        return (
            <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white">
                <Clapperboard className="w-16 h-16 mb-4" />
                <h2 className="text-2xl font-bold">No Shorts Yet</h2>
                <p className="text-muted-foreground mt-2">Check back later for new short videos!</p>
                <Button variant="outline" className="mt-8" onClick={() => router.push('/')}>Go Home</Button>
            </div>
        )
    }

    if (!currentShort || !currentChannel) {
        // This can happen briefly when the index changes, show skeleton
        return <ShortsPlayerSkeleton />;
    }

    return (
        <div 
            id="shorts-container"
            className="h-screen w-screen bg-black flex items-center justify-center overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className="absolute top-4 left-4 z-20">
                <Button variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/70 rounded-full" onClick={() => router.back()}>
                    <X className="h-6 w-6" />
                </Button>
            </div>
            {/* Desktop scroll buttons */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:block">
                 <Button variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/70 rounded-full" onClick={handlePrev} disabled={currentIndex === 0}>
                    <ArrowUp className="h-6 w-6" />
                </Button>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:block">
                 <Button variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/70 rounded-full" onClick={handleNext} disabled={currentIndex === shorts.length - 1}>
                    <ArrowDown className="h-6 w-6" />
                </Button>
            </div>

            <div key={currentShort.id} className="relative w-full h-full max-w-md aspect-[9/16] animate-in fade-in">
                <VideoPlayer youtubeId={currentShort.youtubeVideoId} onEnd={handleNext} />
                
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent text-white">
                    <div className='flex items-center gap-3'>
                        <Avatar>
                            <AvatarImage src={currentChannel.logoUrl} />
                            <AvatarFallback>{currentChannel.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold">{currentChannel.name}</h3>
                        <Button size="sm" className='ml-2'>Follow</Button>
                    </div>
                    <p className="mt-2 text-sm">{currentShort.title}</p>
                </div>

                <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4 text-white">
                     <Button variant="ghost" size="icon" className="flex flex-col h-auto" onClick={handleShare}>
                        <Share2 className="h-8 w-8" />
                        <span className="text-xs">Share</span>
                    </Button>
                </div>
            </div>
            <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} onLoginSuccess={() => setIsAuthDialogOpen(false)} />
        </div>
    );
}

// Using Suspense to handle Next.js's static rendering of search params
export default function ShortsPlayerPage() {
    return (
        <Suspense fallback={<ShortsPlayerSkeleton />}>
            <ShortsPlayerInner />
        </Suspense>
    )
}
