
'use client';

import { notFound, useRouter } from 'next/navigation';
import SiteHeader from '../../../components/site-header';
import { VideoPlayer } from '../../../components/video-player';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Share, Star, Check, PlayCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '../../../hooks/use-toast';
import { useEffect, useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Card, CardContent } from '../../../components/ui/card';
import { useCollection, useDoc, useFirebase, useMemoFirebase, useUser, setDocumentNonBlocking, deleteDocumentNonBlocking } from '../../../firebase';
import { collection, doc, query, where, limit, serverTimestamp, Timestamp, orderBy } from 'firebase/firestore';
import type { Video, Channel, UserFollow } from '../../../lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog';

function toDate(timestamp: Timestamp | Date | string): Date {
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    return new Date(timestamp);
}

export default function WatchPage({ params }: { params: { videoId: string } }) {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isPremiumDialogOpen, setIsPremiumDialogOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);

  // Fetch the video from URL param
  const videoRef = useMemoFirebase(() => doc(firestore, 'videos', params.videoId), [firestore, params.videoId]);
  const { data: initialVideo, isLoading: videoLoading } = useDoc<Video>(videoRef);
  
  // Set current video initially
  useEffect(() => {
    if (initialVideo && !currentVideo) {
      setCurrentVideo(initialVideo);
    }
  }, [initialVideo, currentVideo]);

  useEffect(() => {
    if (currentVideo) {
      window.history.pushState({}, '', `/watch/${currentVideo.id}`);
      if (user) {
        const historyRef = doc(firestore, 'users', user.uid, 'history', currentVideo.id);
        setDocumentNonBlocking(historyRef, {
          videoId: currentVideo.id,
          watchedAt: serverTimestamp(),
        }, { merge: true });
      }
    }
  }, [currentVideo, user, firestore]);
  
  // Fetch the associated channel
  const channelRef = useMemoFirebase(() => currentVideo ? doc(firestore, 'channels', currentVideo.channelId) : null, [firestore, currentVideo]);
  const { data: channel, isLoading: channelLoading } = useDoc<Channel>(channelRef);

  // Fetch all videos for next/previous navigation
  const allVideosQuery = useMemoFirebase(() => query(collection(firestore, 'videos'), orderBy('createdAt', 'desc')), [firestore]);
  const { data: allVideos, isLoading: allVideosLoading } = useCollection<Video>(allVideosQuery);

  // Determine next and previous videos
  const { previousVideoId, nextVideoId } = useMemo(() => {
    if (!allVideos || allVideos.length === 0 || !currentVideo) {
      return { previousVideoId: null, nextVideoId: null };
    }
    const currentIndex = allVideos.findIndex(v => v.id === currentVideo.id);
    if (currentIndex === -1) {
      return { previousVideoId: null, nextVideoId: null };
    }
    const previousVideo = currentIndex > 0 ? allVideos[currentIndex - 1] : null;
    const nextVideo = currentIndex < allVideos.length - 1 ? allVideos[currentIndex + 1] : null;
    return { previousVideoId: previousVideo?.id, nextVideoId: nextVideo?.id };
  }, [allVideos, currentVideo]);

  // Fetch a list of other videos for the sidebar
  const otherVideosQuery = useMemoFirebase(() => currentVideo ? query(collection(firestore, 'videos'), where('id', '!=', currentVideo.id), limit(10)) : null, [firestore, currentVideo]);
  const { data: otherVideos, isLoading: otherVideosLoading } = useCollection<Video>(otherVideosQuery);
  const { data: channels } = useCollection<Channel>(useMemoFirebase(() => collection(firestore, 'channels'), [firestore]));

  // Check if user is following the channel
  const followRef = useMemoFirebase(() => user && channel ? doc(firestore, 'users', user.uid, 'follows', channel.id) : null, [user, channel]);
  const { data: userFollow } = useDoc<UserFollow>(followRef);

  const isFollowing = !!userFollow;

  const handleVideoSelect = (video: Video) => {
    setCurrentVideo(video);
  };
  
  const navigateToVideo = (videoId: string | null) => {
    if (videoId) {
      const videoToPlay = allVideos?.find(v => v.id === videoId);
      if (videoToPlay) {
        setCurrentVideo(videoToPlay);
      }
    }
  };

  const handleFollowToggle = () => {
    if (!user || !channel) {
      toast({ variant: 'destructive', title: 'Please log in to follow.' });
      return;
    }
    if (isFollowing) {
      deleteDocumentNonBlocking(followRef!);
      toast({ title: `Unfollowed ${channel.name}` });
    } else {
      setDocumentNonBlocking(followRef!, {
        channelId: channel.id,
        userId: user.uid,
        followedAt: serverTimestamp(),
      }, { merge: true });
      toast({ title: `Followed ${channel.name}!` });
    }
  };

  const handleVideoEnd = () => {
    if (nextVideoId) {
      navigateToVideo(nextVideoId);
    }
  };
  
  if (videoLoading || channelLoading || otherVideosLoading || allVideosLoading) {
    return <div>Loading...</div>;
  }

  if (!initialVideo && !videoLoading) {
    notFound();
  }

  if (!currentVideo) {
    return <div>Loading player...</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 md:py-8">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 md:px-0">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="aspect-video mb-4 md:rounded-lg overflow-hidden md:mx-0 -mx-4">
              <VideoPlayer youtubeId={currentVideo.youtubeVideoId} onEnd={handleVideoEnd} key={currentVideo.id} />
            </div>
            
            <div className="px-4 md:px-0">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold font-headline">{currentVideo.title}</h2>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => navigateToVideo(previousVideoId)} disabled={!previousVideoId}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                     <Button variant="outline" size="icon" onClick={() => navigateToVideo(nextVideoId)} disabled={!nextVideoId}>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={channel?.logoUrl || `https://picsum.photos/seed/${channel?.id}/40/40`} alt={channel?.name} />
                            <AvatarFallback>{channel?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{channel?.name}</p>
                            <p className="text-sm text-muted-foreground">{formatDistanceToNow(toDate(currentVideo.createdAt))} ago</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant={isFollowing ? 'secondary': 'outline'} onClick={handleFollowToggle}>
                        {isFollowing ? <Check className="mr-2 h-4 w-4" /> : <Star className="mr-2 h-4 w-4" />}
                        {isFollowing ? 'Following' : 'Follow'}
                        </Button>
                        <Button variant="secondary" onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast({ title: 'Copied to clipboard!' });
                        }}><Share className="mr-2 h-4 w-4" /> Share</Button>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                    <p className="text-sm font-medium">Related topics</p>
                    <Link href="/category/News"><Badge variant="outline">#news</Badge></Link>
                    <Link href="/category/Technology"><Badge variant="outline">#technology</Badge></Link>
                    <Link href="/category/Sports"><Badge variant="outline">#sports</Badge></Link>
                </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1 px-4 md:px-0">
            <h3 className="text-lg font-semibold mb-2 text-muted-foreground">My Headlines</h3>

            <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                <div className="space-y-4">
                    {otherVideos?.map((videoItem) => {
                        const videoChannel = channels?.find(c => c.id === videoItem.channelId);
                        const isPlaying = videoItem.id === currentVideo.id;
                        return (
                        <div key={videoItem.id} onClick={() => handleVideoSelect(videoItem)} className="cursor-pointer group flex gap-4 items-start p-2 rounded-lg hover:bg-card/80">
                            <div className="relative w-32 h-20 flex-shrink-0">
                                <Image
                                src={videoItem.thumbnailUrl}
                                alt={videoItem.title}
                                fill
                                className="rounded-md object-cover"
                                />
                                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-sm">
                                  {Math.floor(videoItem.views / 60000)}:{String(Math.floor((videoItem.views % 60000)/1000)).padStart(2,'0')}
                                </div>
                            </div>
                            <div className="flex-grow">
                                {isPlaying && (
                                    <Badge variant="default" className="mb-1 text-xs animate-pulse">
                                        <PlayCircle className="mr-1 h-3 w-3" />
                                        Now Playing
                                    </Badge>
                                )}
                                <h3 className="text-sm font-semibold line-clamp-3 leading-snug group-hover:text-primary">{videoItem.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{videoChannel?.name} • {formatDistanceToNow(toDate(videoItem.createdAt))} ago</p>
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

    