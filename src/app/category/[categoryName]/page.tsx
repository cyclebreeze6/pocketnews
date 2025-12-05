

'use client';

import { useCollection, useFirebase, useMemoFirebase, useUser, setDocumentNonBlocking, deleteDocumentNonBlocking, useDoc } from '../../../firebase';
import SiteHeader from '../../../components/site-header';
import { VideoPlayer } from '../../../components/video-player';
import { Badge } from '../../../components/ui/badge';
import Image from 'next/image';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../../../components/ui/button';
import { Share, Star, PlayCircle, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Card, CardContent } from '../../../components/ui/card';
import type { Video, Channel, UserFollow } from '../../../lib/types';
import { collection, query, where, serverTimestamp, doc, Timestamp } from 'firebase/firestore';
import { useToast } from '../../../hooks/use-toast';
import { useState, useEffect } from 'react';
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

function toDate(timestamp: Timestamp | Date | string): Date {
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    return new Date(timestamp);
}

export default function CategoryPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [isPremiumDialogOpen, setIsPremiumDialogOpen] = useState(false);
  
  const categoryName = decodeURIComponent(params.categoryName as string);

  const videosQuery = useMemoFirebase(() => 
    query(collection(firestore, 'videos'), where('contentCategory', '==', categoryName)),
    [firestore, categoryName]
  );
  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  
  const { data: videos, isLoading: videosLoading } = useCollection<Video>(videosQuery);
  const { data: channels, isLoading: channelsLoading } = useCollection<Channel>(channelsQuery);
  
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);

  useEffect(() => {
    if (videos && videos.length > 0) {
      setCurrentVideo(videos[0]);
    }
  }, [videos]);
  
  const currentChannel = channels?.find((c) => c.id === currentVideo?.channelId);
  
  const followRef = useMemoFirebase(() => user && currentVideo ? doc(firestore, 'users', user.uid, 'follows', currentVideo.channelId) : null, [user, currentVideo, firestore]);
  const { data: userFollow } = useDoc<UserFollow>(followRef);
  const isFollowing = !!userFollow;


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
  
  const handleFollowToggle = () => {
    if (!user || !currentChannel) {
      toast({
        variant: 'destructive',
        title: 'Please log in to follow channels.',
      });
      return;
    }
    const followDocRef = doc(firestore, 'users', user.uid, 'follows', currentChannel.id);
    if (isFollowing) {
      deleteDocumentNonBlocking(followDocRef);
      toast({ title: `Unfollowed ${currentChannel.name}` });
    } else {
      setDocumentNonBlocking(followDocRef, {
        channelId: currentChannel.id,
        userId: user.uid,
        followedAt: serverTimestamp(),
      }, { merge: true });
      toast({ title: `Followed ${currentChannel.name}!` });
    }
  };
  
    const handleVideoEnd = () => {
    if (!videos || !currentVideo) return;
    const currentIndex = videos.findIndex(v => v.id === currentVideo.id);
    if (currentIndex > -1 && currentIndex < videos.length - 1) {
      setCurrentVideo(videos[currentIndex + 1]);
    }
  }

  if (videosLoading || channelsLoading) {
    return <div>Loading...</div>;
  }
  
  if (!videos || videos.length === 0) {
     return (
        <div className="flex min-h-screen w-full flex-col">
            <SiteHeader />
            <main className="flex-1 py-12 md:py-16 text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-4 font-headline">
                    Category: {categoryName}
                </h1>
                <p>No videos found in this category yet.</p>
            </main>
        </div>
     )
  }

  if (!currentVideo || !currentChannel || !otherVideos) {
    return <div>Loading...</div>; 
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 md:py-8">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 md:px-0">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="px-4 md:px-0">
                <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">
                    Category: {categoryName}
                </h1>
            </div>
            <div className="aspect-video mb-4 md:rounded-lg overflow-hidden md:mx-0 -mx-4">
              <VideoPlayer youtubeId={currentVideo.youtubeVideoId} key={currentVideo.id} onEnd={handleVideoEnd} />
            </div>
            
            <div className="px-4 md:px-0">
                <h2 className="text-2xl md:text-3xl font-bold font-headline mb-4">{currentVideo.title}</h2>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={currentChannel?.logoUrl || `https://picsum.photos/seed/${currentChannel?.id}/40/40`} alt={currentChannel?.name} />
                            <AvatarFallback>{currentChannel?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{currentChannel?.name}</p>
                            <p className="text-sm text-muted-foreground">{formatDistanceToNow(toDate(currentVideo.createdAt))} ago</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button variant={isFollowing ? 'secondary': 'outline'} onClick={handleFollowToggle}>
                            {isFollowing ? <Check className="mr-2 h-4 w-4" /> : <Star className="mr-2 h-4 w-4" />}
                            {isFollowing ? 'Following' : 'Follow'}
                        </Button>
                        <Button variant="secondary"><Share className="mr-2 h-4 w-4" /> Share</Button>
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
          
          {/* Sidebar */}
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
            <DialogTitle>Coming Soon!</DialogTitle>
            <DialogDescription>
              Premium membership access with ad-free viewing is on its way. Stay tuned!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsPremiumDialogOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
