import { channels, videos } from '@/lib/data';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import { VideoCard } from '@/components/video-card';

export default function ChannelPage({ params }: { params: { channelId: string } }) {
  const channel = channels.find((c) => c.id === params.channelId);

  if (!channel) {
    notFound();
  }

  const channelVideos = videos.filter((v) => v.channelId === channel.id);

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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {channelVideos.length > 0 ? (
                channelVideos.map((video) => <VideoCard key={video.id} video={video} />)
              ) : (
                <p className="col-span-full text-center text-muted-foreground">No videos in this channel yet.</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export async function generateStaticParams() {
  return channels.map((channel) => ({
    channelId: channel.id,
  }));
}
