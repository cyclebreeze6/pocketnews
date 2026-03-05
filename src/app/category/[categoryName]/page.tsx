'use client';

import { useCollection, useFirebase, useMemoFirebase, useUser, setDocumentNonBlocking, useDoc, deleteDocumentNonBlocking } from '../../../firebase';
import SiteHeader from '../../../components/site-header';
import { VideoPlayer } from '../../../components/video-player';
import { Badge } from '../../../components/ui/badge';
import Image from 'next/image';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../../../components/ui/button';
import { Share, Star, PlayCircle, Check, Copy, UserPlus, UserCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Card, CardContent } from '../../../components/ui/card';
import type { Video, Channel, UserProfile } from '../../../lib/types';
import { collection, query, where, serverTimestamp, doc, Timestamp, orderBy, limit, getDocs } from 'firebase/firestore';
import { useToast } from '../../../hooks/use-toast';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../components/ui/popover';
import { useRegion } from '../../../context/region-context';
import { AuthDialog } from '../../../components/auth-dialog';


function toDate(timestamp: Timestamp | Date | string): Date {
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    return new Date(timestamp);
}

const FacebookIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const WhatsAppIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
);

export default function CategoryPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const { selectedRegion } = useRegion();
  const [isPremiumDialogOpen, setIsPremiumDialogOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  
  const categoryName = decodeURIComponent(params.categoryName as string);

  const [videos, setVideos] = useState<Video[] | null>(null);
  const [videosLoading, setVideosLoading] = useState(true);

  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const { data: channels, isLoading: channelsLoading } = useCollection<Channel>(channelsQuery);

  useEffect(() => {
    const fetchCategoryVideos = async () => {
        setVideosLoading(true);

        const queryConstraints: any[] = [];
        
        queryConstraints.push(where('contentCategory', '==', categoryName));
        
        if (selectedRegion && selectedRegion !== 'Global') {
          queryConstraints.push(where('regions', 'array-contains', selectedRegion));
        }

        queryConstraints.push(orderBy('createdAt', 'desc'));
        queryConstraints.push(limit(20)); // Limit to 20 results

        try {
          const q = query(collection(firestore, 'videos'), ...queryConstraints);
          const snapshot = await getDocs(q);
          const videosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video));
          setVideos(videosData);
        } catch (e: any) {
          console.error("Error fetching category videos:", e);
          setVideos([]); // Set to empty on error
        } finally {
          setVideosLoading(false);
        }
    };

    fetchCategoryVideos();
  }, [firestore, categoryName, selectedRegion]);
  
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);

  useEffect(() => {
    if (videos && videos.length > 0) {
      setCurrentVideo(videos[0]);
    } else if (videos && videos.length === 0) {
        setCurrentVideo(null);
    }
  }, [videos]);
  
  const currentChannel = channels?.find((c) => c.id === currentVideo?.channelId);

  const followRef = useMemoFirebase(() => user && !user.isAnonymous && currentChannel ? doc(firestore, 'users', user.uid, 'followedChannels', currentChannel.id) : null, [firestore, user, currentChannel]);
  const { data: followDoc } = useDoc(followRef);
  const isFollowing = !!followDoc;
  
   useEffect(() => {
    if (currentVideo && user) {
        const historyRef = doc(firestore, 'users', user.uid, 'history', currentVideo.id);
        setDocumentNonBlocking(historyRef, {
          videoId: currentVideo.id,
          watchedAt: serverTimestamp(),
        }, { merge: true });
    }
  }, [currentVideo, user, firestore]);
  
  const otherVideos = videos?.slice(0, 10);
  
  const handleNextVideo = useCallback(() => {
    if (!videos || !currentVideo) return;
    const currentIndex = videos.findIndex(v => v.id === currentVideo.id);
    if (currentIndex > -1 && currentIndex < videos.length - 1) {
      setCurrentVideo(videos[currentIndex + 1]);
    }
  }, [videos, currentVideo]);

  const handlePreviousVideo = useCallback(() => {
    if (!videos || !currentVideo) return;
    const currentIndex = videos.findIndex(v => v.id === currentVideo.id);
    if (currentIndex > 0) {
      setCurrentVideo(videos[currentIndex - 1]);
    }
  }, [videos, currentVideo]);

  const handleVideoEnd = handleNextVideo;

    const handleShare = (platform: 'facebook' | 'whatsapp' | 'copy') => {
        if (!currentVideo) return;
        const videoUrl = `${window.location.origin}/watch/${currentVideo.id}`;
        
        switch (platform) {
        case 'facebook':
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`, '_blank');
            break;
        case 'whatsapp':
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(currentVideo.title + ' ' + videoUrl)}`, '_blank');
            break;
        case 'copy':
            navigator.clipboard.writeText(videoUrl);
            toast({ title: "Link copied to clipboard!" });
            break;
        }
    };

    const handleFollowToggle = () => {
        if (!user || !currentChannel) return;
        if (user.isAnonymous) {
            setIsAuthDialogOpen(true);
            return;
        }

        const followDocRef = doc(firestore, 'users', user.uid, 'followedChannels', currentChannel.id);

        if (isFollowing) {
            deleteDocumentNonBlocking(followDocRef);
            toast({ title: 'Unfollowed', description: `You've unfollowed ${currentChannel.name}.` });
        } else {
            setDocumentNonBlocking(followDocRef, { 
                channelId: currentChannel.id,
                followedAt: serverTimestamp() 
            }, {});
            toast({ title: 'Followed!', description: `You're now following ${currentChannel.name}.` });
        }
    };


  const isLoading = videosLoading || channelsLoading || isUserLoading;

  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!videos || videos.length === 0) {
     return (
        <div className="flex min-h-screen w-full flex-col">
            <SiteHeader />
            <main className="flex-1 py-12 md:py-16 text-center">
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                    No videos in {categoryName}
                </h2>
                <p>No videos found in this category. Check back later!</p>
            </main>
        </div>
     )
  }

  if (!currentVideo || !currentChannel || !otherVideos) {
    return <div>Loading...</div>; 
  }

  const currentIndex = videos?.findIndex(v => v.id === currentVideo.id) ?? -1;
  const hasNext = currentIndex > -1 && currentIndex < (videos?.length ?? 0) - 1;
  const hasPrevious = currentIndex > 0;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 md:py-8">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 md:px-0">
          <div className="lg:col-span-2">
            <div className="aspect-video mb-4 md:rounded-lg overflow-hidden md:mx-0 -mx-4">
              <VideoPlayer 
                youtubeId={currentVideo.youtubeVideoId} 
                videoUrl={currentVideo.videoUrl}
                key={currentVideo.id} 
                onEnd={handleVideoEnd}
                onNext={handleNextVideo}
                onPrevious={handlePreviousVideo}
                hasNext={hasNext}
                hasPrevious={hasPrevious}
              />
            </div>
            
            <div className="px-4 md:px-0">
                <h2 className="text-2xl md:text-3xl font-bold font-headline mb-4">{currentVideo.title}</h2>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <Link href={`/channels/${currentChannel.id}`}>
                            <Avatar>
                                <AvatarImage src={currentChannel.logoUrl || `https://picsum.photos/seed/${currentChannel.id}/40/40`} alt={currentChannel.name} />
                                <AvatarFallback>{currentChannel.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </Link>
                        <div>
                            <Link href={`/channels/${currentChannel.id}`} className="flex items-center gap-2">
                                {currentChannel.region && currentChannel.region.length > 0 && (
                                    <span className="text-xs text-muted-foreground font-normal bg-muted px-1.5 py-0.5 rounded">
                                        {currentChannel.region[0]}
                                    </span>
                                )}
                                <p className="font-semibold hover:underline">{currentChannel.name}</p>
                            </Link>
                            <p className="text-sm text-muted-foreground">{formatDistanceToNow(toDate(currentVideo.createdAt))} ago</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button variant={isFollowing ? 'secondary' : 'outline'} onClick={handleFollowToggle}>
                            {isFollowing ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                            {isFollowing ? 'Following' : 'Follow'}
                        </Button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="secondary"><Share className="mr-2 h-4 w-4" /> Share</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2">
                                <div className="flex gap-2">
                                    <Button size="icon" variant="outline" onClick={() => handleShare('facebook')}>
                                        <FacebookIcon className="h-5 w-5" />
                                    </Button>
                                     <Button size="icon" variant="outline" onClick={() => handleShare('whatsapp')}>
                                        <WhatsAppIcon className="h-5 w-5" />
                                    </Button>
                                    <Button size="icon" variant="outline" onClick={() => handleShare('copy')}>
                                        <Copy className="h-5 w-5" />
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                    <p className="text-sm font-medium">Related topics</p>
                    <Badge variant="outline">#ukraine</Badge>
                    <Badge variant="outline">#trump</Badge>
                    <Badge variant="outline">#russia</Badge>
                </div>
            </div>
          </div>
          
          <div className="lg:col-span-1 px-4 md:px-0">
            <h3 className="text-lg font-semibold mb-2 text-muted-foreground mt-16">More in {categoryName}</h3>

            <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                <div className="space-y-4">
                    {otherVideos.map((video) => {
                        const videoChannel = channels.find(c => c.id === video.channelId);
                        const isPlaying = video.id === currentVideo.id;
                        return (
                        <div onClick={() => setCurrentVideo(video)} key={video.id} className="cursor-pointer group flex gap-4 items-start p-2 rounded-lg hover:bg-card/80">
                            <div className="relative w-32 h-20 flex-shrink-0">
                                <Image
                                src={video.thumbnailUrl}
                                alt={video.title}
                                fill
                                className="rounded-md object-cover"
                                />
                                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-sm">
                                  {Math.floor(video.views / 60000)}:{String(Math.floor((video.views % 60000)/1000)).padStart(2,'0')}
                                </div>
                            </div>
                            <div className="flex-grow">
                                {isPlaying && (
                                    <Badge variant="default" className="mb-1 text-xs animate-pulse">
                                        <PlayCircle className="mr-1 h-3 w-3" />
                                        Now Playing
                                    </Badge>
                                )}
                                <h3 className="text-sm font-semibold line-clamp-3 leading-snug group-hover:text-primary">{video.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{videoChannel?.name} • {formatDistanceToNow(toDate(video.createdAt))} ago</p>
                            </div>
                        </div>
                        )
                    })}
                </div>
            </ScrollArea>
             <Card className="mt-8 bg-card/50">
                <CardContent className="p-4 flex items-center justify-between">
                    <p className="text-sm max-w-[200px]">Enjoy ad-free news from 400+ local, national, and global channels</p>
                    <Button variant="secondary" onClick={() => setIsPremiumDialogOpen(true)}>Go ad-free</Button>
                </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        Meet the #1 App to Stream News. Watch Free!
      </footer>
      <Dialog open={isPremiumDialogOpen} onOpenChange={setIsPremiumDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Premium Membership Coming Soon!</DialogTitle>
            <DialogDescription>
              Get ready for an ad-free experience, exclusive content, and more. We're putting the final touches on our premium membership.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsPremiumDialogOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} onLoginSuccess={() => setIsAuthDialogOpen(false)} />
    </div>
  );
}
