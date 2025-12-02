
'use client';

import SiteHeader from '@/components/site-header';
import { videos, channels } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function HistoryPage() {
  // For now, we'll just show all videos as if they are in the history
  const historyVideos = videos.slice().reverse();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2">
                <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">
                    Watch History
                </h1>
                <div className="space-y-6">
                {historyVideos.map((video) => {
                    const channel = channels.find((c) => c.id === video.channelId);
                    return (
                    <div key={video.id} className="group relative flex flex-col sm:flex-row gap-4 items-start">
                        <Link href={`/watch/${video.id}`} className="flex-shrink-0">
                             <div className="relative w-full sm:w-48 h-28">
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
                        </Link>
                        <div className="flex-grow">
                            <Link href={`/watch/${video.id}`}>
                                <h3 className="text-lg font-semibold line-clamp-2 leading-snug group-hover:text-primary">{video.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{channel?.name} • {formatDistanceToNow(new Date(video.createdAt))} ago</p>
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{video.description}</p>
                            </Link>
                        </div>
                        <Button variant="ghost" size="icon" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    );
                })}
                </div>
            </div>
             <div className="md:col-span-1">
                <h2 className="text-xl font-semibold mb-4">Manage History</h2>
                <Separator />
                <Button variant="ghost" className="w-full justify-start px-2 mt-4 text-destructive hover:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear all watch history
                </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
