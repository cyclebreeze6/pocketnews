import SiteHeader from '@/components/site-header';
import { VideoCard } from '@/components/video-card';
import { videos } from '@/lib/data';

export default function DashboardPage() {
  const watchedVideos = videos.slice(0, 5); // Mock data

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">
            My Watch History
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {watchedVideos.length > 0 ? (
              watchedVideos.map((video) => <VideoCard key={video.id} video={video} />)
            ) : (
              <p className="col-span-full text-center text-muted-foreground">You haven't watched any videos yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
