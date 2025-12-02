'use client';

import Link from 'next/link';
import { channels, videos } from '@/lib/data';
import SiteHeader from '@/components/site-header';
import { VideoPlayer } from '@/components/video-player';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow } from 'date-fns';
import { VideoCard } from '@/components/video-card';

export default function Home() {
  const featuredVideo = videos[0];
  const otherVideos = videos.slice(1);
  const channel = channels.find((c) => c.id === featuredVideo.channelId);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
       <main className="flex-1 py-6 md:py-8">
        <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                <div className="md:col-span-2 lg:col-span-3">
                    <h2 className="text-2xl font-bold tracking-tight mb-4 font-headline">Featured Video</h2>
                    <Link href={`/watch/${featuredVideo.id}`} className="group">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-card p-4 rounded-lg">
                            <div className="aspect-video">
                                <VideoPlayer youtubeId={featuredVideo.youtubeId} />
                            </div>
                            <div>
                                <Badge variant="outline" className="mb-2">{channel?.name}</Badge>
                                <h3 className="text-2xl font-bold font-headline mb-2 group-hover:text-primary">{featuredVideo.title}</h3>
                                <p className="text-muted-foreground text-sm mb-4">{featuredVideo.description}</p>
                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(featuredVideo.createdAt))} ago</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            <h2 className="text-2xl font-bold tracking-tight mb-4 font-headline">More Videos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {otherVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                ))}
            </div>
        </div>
      </main>
    </div>
  );
}
