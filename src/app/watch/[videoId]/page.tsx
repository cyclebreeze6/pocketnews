import { videos, channels } from '@/lib/data';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import { VideoPlayer } from '@/components/video-player';
import { VideoCard } from '@/components/video-card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function WatchPage({ params }: { params: { videoId: string } }) {
  const video = videos.find((v) => v.id === params.videoId);

  if (!video) {
    notFound();
  }

  const channel = channels.find((c) => c.id === video.channelId);
  const relatedVideos = videos.filter((v) => v.channelId === video.channelId && v.id !== video.id);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 py-6 md:py-12">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="aspect-video">
              <VideoPlayer youtubeId={video.youtubeId} />
            </div>
            <div className="mt-4">
              <h1 className="text-2xl md:text-3xl font-bold font-headline">{video.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>{video.views.toLocaleString()} views</span>
                <span>•</span>
                <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                {channel && <Badge variant="outline">{channel.name}</Badge>}
              </div>
              <p className="mt-4 text-foreground/80">{video.description}</p>
            </div>
          </div>
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold mb-4 font-headline">More from {channel?.name}</h2>
             <Separator className="mb-4" />
            <div className="space-y-4">
              {relatedVideos.length > 0 ? (
                relatedVideos.map((relatedVideo) => (
                  <VideoCard key={relatedVideo.id} video={relatedVideo} />
                ))
              ) : (
                <p className="text-muted-foreground">No other videos in this channel.</p>
              )}
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
