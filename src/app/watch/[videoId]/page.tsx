'use client';

import { videos, channels } from '@/lib/data';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import { VideoPlayer } from '@/components/video-player';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share, Clock, Copy } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { VideoCard } from '@/components/video-card';


export default function WatchPage({ params }: { params: { videoId: string } }) {
  const video = videos.find((v) => v.id === params.videoId);

  if (!video) {
    notFound();
  }

  const channel = channels.find((c) => c.id === video.channelId);
  const relatedVideos = videos.filter((v) => v.id !== video.id && v.channelId === video.channelId).slice(0,4);
  const moreVideos = videos.filter((v) => v.id !== video.id && v.channelId !== video.channelId).slice(0,5);

  const { toast } = useToast();
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    setVideoUrl(window.location.href);
  }, [params.videoId]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(videoUrl);
    toast({
      title: 'Copied to clipboard!',
      description: 'The video link has been copied.',
    });
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 py-6 md:py-8">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-6 md:px-8">
          <div className="lg:col-span-2">
            <div className="aspect-video mb-4">
              <VideoPlayer youtubeId={video.youtubeId} />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                    <Badge variant="outline" className="mb-2">{channel?.name}</Badge>
                    <h1 className="text-2xl md:text-3xl font-bold font-headline mb-2">{video.title}</h1>
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{format(new Date(video.createdAt), 'PP')}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
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
            <p className="text-muted-foreground">{video.description}</p>
          </div>
          <div className="lg:col-span-1 space-y-8">
            <div>
                <h2 className="text-xl font-bold mb-4 font-headline">More from {channel?.name}</h2>
                <div className="space-y-4">
                    {relatedVideos.map((relatedVideo) => (
                        <Link key={relatedVideo.id} href={`/watch/${relatedVideo.id}`} className="group flex gap-4 items-start">
                            <div className="relative w-32 h-20 flex-shrink-0">
                                <Image
                                src={relatedVideo.thumbnailUrl}
                                alt={relatedVideo.title}
                                fill
                                className="rounded-md object-cover"
                                />
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-primary">{relatedVideo.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(relatedVideo.createdAt))} ago</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <div>
                <h2 className="text-xl font-bold mb-4 font-headline">More Videos</h2>
                 <div className="space-y-4">
                    {moreVideos.map((relatedVideo) => (
                        <Link key={relatedVideo.id} href={`/watch/${relatedVideo.id}`} className="group flex gap-4 items-start">
                            <div className="relative w-32 h-20 flex-shrink-0">
                                <Image
                                src={relatedVideo.thumbnailUrl}
                                alt={relatedVideo.title}
                                fill
                                className="rounded-md object-cover"
                                />
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-primary">{relatedVideo.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{channels.find(c=> c.id === relatedVideo.channelId)?.name} • {formatDistanceToNow(new Date(relatedVideo.createdAt))} ago</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export async function generateStaticParams() {
  return videos.map((video) => ({
    videoId: video.id,
  }));
}
