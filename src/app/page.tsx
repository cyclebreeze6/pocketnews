import Link from 'next/link';
import { channels, videos } from '@/lib/data';
import { VideoCard } from '@/components/video-card';
import SiteHeader from '@/components/site-header';
import { Button } from '@/components/ui/button';

export default function Home() {
  const latestVideos = videos.slice(0, 12);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none font-headline">
                Pocketnews TV
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Curated news channels, right in your pocket. Stay informed with our collection of videos from trusted sources.
              </p>
            </div>
          </div>
        </section>

        <section id="channels" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/20">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8 font-headline">Channels</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {channels.map((channel) => (
                <Link key={channel.id} href={`/channels/${channel.id}`}>
                  <div className="group relative overflow-hidden rounded-lg bg-card p-4 text-card-foreground shadow-lg transition-transform duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl">
                    <div className="flex flex-col justify-between h-full">
                        <h3 className="text-xl font-bold font-headline">{channel.name}</h3>
                        <p className="text-sm text-muted-foreground mt-2">{channel.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        
        <section id="latest-videos" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">Latest Videos</h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Catch up on the latest uploads from across our channels.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {latestVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 Pocketnews TV. All rights reserved.</p>
      </footer>
    </div>
  );
}
