
'use client';

import { notFound } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import { VideoPlayer } from '@/components/video-player';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share, Star, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { useCollection, useDoc, useFirebase, useMemoFirebase, useUser, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, limit, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Video, Channel, UserFollow } from '@/lib/types';

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

  const videoRef = useMemoFirebase(() => doc(firestore, 'videos', params.videoId), [firestore, params.videoId]);
  const { data: video, isLoading: videoLoading } = useDoc<Video>(videoRef);
  
  const channelRef = useMemoFirebase(() => video ? doc(firestore, 'channels', video.channelId) : null, [firestore, video]);
  const { data: channel, isLoading: channelLoading } = useDoc<Channel>(channelRef);

  const otherVideosQuery = useMemoFirebase(() => video ? query(collection(firestore, 'videos'), where('id', '!=', video.id), limit(7)) : null, [firestore, video]);
  const { data: otherVideos, isLoading: otherVideosLoading } = useCollection<Video>(otherVideosQuery);

  const followRef = useMemoFirebase(() => user && channel ? doc(firestore, 'users', user.uid, 'follows', channel.id) : null, [user, channel]);
  const { data: userFollow } = useDoc<UserFollow>(followRef);

  const [videoUrl, setVideoUrl] = useState('');
  const isFollowing = !!userFollow;

  useEffect(() => {
    setVideoUrl(window.location.href);
     if (user && video) {
      const historyRef = doc(firestore, 'users', user.uid, 'history', video.id);
      setDocumentNonBlocking(historyRef, {
        videoId: video.id,
        watchedAt: serverTimestamp(),
        videoTitle: video.title,
        channelId: video.channelId,
      }, { merge: true });
    }
  }, [params.videoId, user, video, firestore]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(videoUrl);
    toast({
      title: 'Copied to clipboard!',
      description: 'The video link has been copied.',
    });
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
  
  if (videoLoading || channelLoading || otherVideosLoading) {
    return <div>Loading...</div>;
  }

  if (!video) {
    notFound();
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 py-6 md:py-8">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-6 md:px-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="aspect-video mb-4">
              <VideoPlayer youtubeId={video.youtubeId} />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold font-headline mb-4">{video.title}</h1>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={`https://picsum.photos/seed/${channel?.id}/40/40`} alt={channel?.name} />
                        <AvatarFallback>{channel?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{channel?.name}</p>
                        <p className="text-sm text-muted-foreground">{formatDistanceToNow(toDate(video.createdAt))} ago</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant={isFollowing ? 'secondary': 'outline'} onClick={handleFollowToggle}>
                      {isFollowing ? <Check className="mr-2 h-4 w-4" /> : <Star className="mr-2 h-4 w-4" />}
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    <Button variant="secondary" onClick={copyToClipboard}><Share className="mr-2 h-4 w-4" /> Share</Button>
                </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
                <p className="text-sm font-medium">Related topics</p>
                <Link href="/category/News"><Badge variant="outline">#news</Badge></Link>
                <Link href="/category/Technology"><Badge variant="outline">#technology</Badge></Link>
                <Link href="/category/Sports"><Badge variant="outline">#sports</Badge></Link>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-2 text-muted-foreground">My Headlines</h3>

            <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                <div className="space-y-4">
                    {otherVideos?.map((videoItem) => {
                        const videoChannel = channel; // Simplified for this context
                        const isPlaying = videoItem.id === video.id;
                        return (
                        <Link key={videoItem.id} href={`/watch/${videoItem.id}`} className="group flex gap-4 items-start p-2 rounded-lg hover:bg-card/80">
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
                                {isPlaying && <Badge variant="default" className="mb-1 text-xs">Now Playing</Badge>}
                                <h3 className="text-sm font-semibold line-clamp-3 leading-snug group-hover:text-primary">{videoItem.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{videoChannel?.name} • {formatDistanceToNow(toDate(videoItem.createdAt))} ago</p>
                            </div>
                        </Link>
                        )
                    })}
                </div>
            </ScrollArea>
             <Card className="mt-8 bg-card/50">
                <CardContent className="p-4 flex items-center justify-between">
                    <p className="text-sm max-w-[200px]">Enjoy ad-free news from 400+ local, national, and global channels</p>
                    <Button variant="secondary">Go ad-free</Button>
                </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        Meet the #1 App to Stream News. Watch Free!
      </footer>
    </div>
  );
}
