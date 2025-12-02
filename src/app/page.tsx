'use client';

import Link from 'next/link';
import { channels, videos } from '@/lib/data';
import SiteHeader from '@/components/site-header';
import { VideoPlayer } from '@/components/video-player';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Share, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  const featuredVideo = videos[0];
  const otherVideos = videos.slice(0, 7); // Show more videos in the sidebar
  const channel = channels.find((c) => c.id === featuredVideo.channelId);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 py-6 md:py-8">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-6 md:px-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="aspect-video mb-4">
              <VideoPlayer youtubeId={featuredVideo.youtubeId} />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold font-headline mb-4">{featuredVideo.title}</h1>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={`https://picsum.photos/seed/${channel?.id}/40/40`} alt={channel?.name} />
                        <AvatarFallback>{channel?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{channel?.name}</p>
                        <p className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(featuredVideo.createdAt))} ago</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline"><Star className="mr-2 h-4 w-4" /> Follow</Button>
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
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
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
                                {index === 0 && <Badge variant="default" className="mb-1 text-xs">Now Playing</Badge>}
                                <h3 className="text-sm font-semibold line-clamp-3 leading-snug group-hover:text-primary">{video.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{videoChannel?.name} • {formatDistanceToNow(new Date(video.createdAt))} ago</p>
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
