

'use client';

import Link from 'next/link';
import { useCollection, useFirebase, useMemoFirebase, useUser, setDocumentNonBlocking } from '../firebase';
import SiteHeader from '../components/site-header';
import { VideoPlayer } from '../components/video-player';
import { Badge } from '../components/ui/badge';
import Image from 'next/image';
import { ScrollArea } from '../components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../components/ui/button';
import { Share, Star, PlayCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Card, CardContent } from '../components/ui/card';
import type { Video, Channel } from '../lib/types';
import { collection, doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '../hooks/use-toast';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog';

function toDate(timestamp: Timestamp | Date | string): Date {
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    return new Date(timestamp);
}

export default function Home() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  const [isPremiumDialogOpen, setIsPremiumDialogOpen] = useState(false);

  const videosQuery = useMemoFirebase(() => collection(firestore, 'videos'), [firestore]);
  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  
  const { data: videos, isLoading: videosLoading } = useCollection<Video>(videosQuery);
  const { data: channels, isLoading: channelsLoading } = useCollection<Channel>(channelsQuery);

  const featuredVideo = videos?.[0];
  const otherVideos = videos?.slice(0, 7);
  const channel = channels?.find((c) => c.id === featuredVideo?.channelId);

  const handleFollow = () => {
    if (!user || !channel) {
      toast({
        variant: 'destructive',
        title: 'Please log in to follow channels.',
      });
      return;
    }
    const followRef = doc(firestore, 'users', user.uid, 'follows', channel.id);
    setDocumentNonBlocking(followRef, {
      channelId: channel.id,
      userId: user.uid,
      followedAt: serverTimestamp(),
    }, { merge: true });
    toast({
      title: `Followed ${channel?.name}!`,
      description: 'You will now be notified of new videos.',
    });
  };

  if (videosLoading || channelsLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <SiteHeader />
        <main className="flex-1 flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-bold mb-4">No videos found</h2>
            <p className="text-muted-foreground">Check back later for new content!</p>
        </main>
      </div>
    );
  }

  if (!featuredVideo || !channel || !otherVideos) {
     return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading video details...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 md:py-8">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 md:px-0">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="aspect-video mb-4 md:rounded-lg overflow-hidden md:mx-0 -mx-4">
              <VideoPlayer youtubeId={featuredVideo.youtubeId} />
            </div>
            
            <div className="px-4 md:px-0">
                <h1 className="text-2xl md:text-3xl font-bold font-headline mb-4">{featuredVideo.title}</h1>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={`https://picsum.photos/seed/${channel?.id}/40/40`} alt={channel?.name} />
                            <AvatarFallback>{channel?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{channel?.name}</p>
                            <p className="text-sm text-muted-foreground">{formatDistanceToNow(toDate(featuredVideo.createdAt))} ago</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleFollow}><Star className="mr-2 h-4 w-4" /> Follow</Button>
                        <Button variant="secondary"><Share className="mr-2 h-4 w-4" /> Share</Button>
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
                    {otherVideos.map((video, index) => {
                        const videoChannel = channels.find(c => c.id === video.channelId);
                        return (
                        <Link key={video.id} href={`/watch/${video.id}`} className="group flex gap-4 items-start p-2 rounded-lg hover:bg-card/80">
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
                                {index === 0 && (
                                    <Badge variant="default" className="mb-1 text-xs animate-pulse">
                                        <PlayCircle className="mr-1 h-3 w-3" />
                                        Now Playing
                                    </Badge>
                                )}
                                <h3 className="text-sm font-semibold line-clamp-3 leading-snug group-hover:text-primary">{video.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{videoChannel?.name} • {formatDistanceToNow(toDate(video.createdAt))} ago</p>
                            </div>
                        </Link>
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
