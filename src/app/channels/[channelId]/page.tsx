

'use client';

import { channels, videos } from '@/lib/data';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import { VideoPlayer } from '@/components/video-player';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share, Clock, Copy } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FollowButton } from '@/components/follow-button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';

export default function ChannelPage({ params }: { params: { channelId: string } }) {
  const channel = channels.find((c) => c.id === params.channelId);

  if (!channel) {
    notFound();
  }

  const channelVideos = videos.filter((v) => v.channelId === channel.id);
  
  if (channelVideos.length === 0) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <SiteHeader />
        <main className="flex-1">
          <section className="w-full py-12 md:py-24 lg:py-32 bg-card">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center space-y-4 text-center">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none font-headline">
                  {channel.name}
                </h1>
                <p className="mx-auto max-w-[700px] text-card-foreground/80 md:text-xl">
                  {channel.description}
                </p>
              </div>
            </div>
          </section>
          
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <p className="col-span-full text-center text-muted-foreground">No videos in this channel yet.</p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const video = channelVideos[0];
  const relatedVideos = channelVideos.slice(1);
  const { toast } = useToast();
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    setVideoUrl(`${window.location.origin}/watch/${video.id}`);
  }, [video.id]);


  const copyToClipboard = () => {
    navigator.clipboard.writeText(videoUrl);
    toast({
      title: 'Copied to clipboard!',
      description: 'The video link has been copied.',
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }


  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 py-6 md:py-8">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-6 md:px-8">
          <div className="lg:col-span-2">
            <div className="aspect-video mb-4">
              <VideoPlayer youtubeId={video.youtubeId} />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold font-headline mb-4">{video.title}</h1>
            
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Image src="https://picsum.photos/seed/reuters/40/40" alt="Channel logo" width={40} height={40} className="rounded-full" />
                        <div>
                            <p className="font-semibold">{channel?.name || 'News Source'}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>{format(new Date(video.createdAt), 'PP')}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {channel && <FollowButton channelName={channel.name} />}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="secondary"><Share className="mr-2 h-4 w-4" /> Share</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Share Video</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Copy the link below to share this video.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="video-link">Video Link</Label>
                                    <div className="flex items-center space-x-2">
                                        <Input id="video-link" value={videoUrl} readOnly />
                                        <Button onClick={copyToClipboard} size="icon" variant="outline">
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold">Related topics</span>
                <Badge variant="secondary">#ukraine</Badge>
                <Badge variant="secondary">#trump</Badge>
                <Badge variant="secondary">#russia</Badge>
            </div>
          </div>
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold mb-4 font-headline" id="my-headlines">My Headlines</h2>
             <ScrollArea className="h-[calc(6*96px)] pr-4">
              <div className="space-y-2">
                {relatedVideos.map((relatedVideo, index) => {
                  const relatedChannel = channels.find(c => c.id === relatedVideo.channelId);
                  const isPlaying = relatedVideo.id === video.id;

                  return (
                    <Link key={relatedVideo.id} href={`/watch/${relatedVideo.id}`}>
                      <div className={`group p-2 rounded-lg transition-colors ${isPlaying ? 'bg-card' : 'hover:bg-card/50'}`}>
                        <div className="flex gap-4">
                          <div className="relative w-32 h-20 flex-shrink-0">
                            <Image
                              src={relatedVideo.thumbnailUrl}
                              alt={relatedVideo.title}
                              fill
                              className="rounded-md object-cover"
                            />
                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-sm">
                               {formatDuration(relatedVideo.watchTime*60)}
                            </div>
                          </div>
                          <div className="flex flex-col justify-between py-1">
                            <div>
                              {isPlaying && <p className="text-xs text-primary font-semibold mb-1 animate-pulse">Now Playing</p>}
                              <h3 className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-primary">{relatedVideo.title}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground">{relatedChannel?.name} • {formatDistanceToNow(new Date(relatedVideo.createdAt))} ago</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </ScrollArea>
            <div className="mt-6 bg-yellow-800/20 p-4 rounded-lg text-center">
                <p className="text-sm mb-2">Enjoy ad-free news from 400+ local, national, and global channels</p>
                <Button variant="secondary" size="sm">Go ad-free</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
