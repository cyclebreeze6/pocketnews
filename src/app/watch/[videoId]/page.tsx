import { videos, channels } from '@/lib/data';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import { VideoPlayer } from '@/components/video-player';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FollowButton } from '@/components/follow-button';

export default function WatchPage({ params }: { params: { videoId: string } }) {
  const video = videos.find((v) => v.id === params.videoId);

  if (!video) {
    notFound();
  }

  const channel = channels.find((c) => c.id === video.channelId);
  const relatedVideos = videos.filter((v) => v.id !== video.id);

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
                                <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {channel && <FollowButton channelName={channel.name} />}
                    <Button variant="secondary"><Share className="mr-2 h-4 w-4" /> Share</Button>
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
            <h2 className="text-xl font-bold mb-4 font-headline">My Headlines</h2>
            <ScrollArea className="h-[calc(6*96px)] pr-4">
              <div className="space-y-2">
                {relatedVideos.map((relatedVideo) => {
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
                              {Math.floor(Math.random() * 5)}:{Math.floor(Math.random()*50+10)}
                            </div>
                          </div>
                          <div className="flex flex-col justify-between">
                            <div>
                              {isPlaying && <p className="text-xs text-primary font-semibold mb-1 animate-pulse">Now Playing</p>}
                              <h3 className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-primary">{relatedVideo.title}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground">{relatedChannel?.name} • {Math.floor(Math.random()*12)+1}h ago</p>
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

export async function generateStaticParams() {
  return videos.map((video) => ({
    videoId: video.id,
  }));
}
