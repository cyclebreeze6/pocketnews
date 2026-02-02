
'use client';

import { notFound, useParams } from 'next/navigation';
import { useDoc, useFirebase, useMemoFirebase } from '../../../firebase';
import type { Video } from '../../../lib/types';
import { doc } from 'firebase/firestore';
import SiteHeader from '../../../components/site-header';
import { VideoPlayer } from '../../../components/video-player';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import Link from 'next/link';
import { Skeleton } from '../../../components/ui/skeleton';

function WatchPageSkeleton() {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <SiteHeader />
            <main className="flex-1 md:py-8">
                <div className="container mx-auto max-w-4xl">
                    <Skeleton className="aspect-video mb-4 md:rounded-lg" />
                     <div className="px-4 md:px-0">
                        <Skeleton className="h-8 w-3/4 mb-4" />
                        <Skeleton className="h-20 w-full mb-4" />
                        <div className="flex items-center gap-2 mt-4">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-6 w-20" />
                        </div>
                        <div className="mt-8">
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function WatchPage() {
    const params = useParams();
    const videoId = params.videoId as string;
    const { firestore } = useFirebase();

    const videoRef = useMemoFirebase(() => videoId ? doc(firestore, 'videos', videoId) : null, [firestore, videoId]);
    const { data: video, isLoading } = useDoc<Video>(videoRef);

    if (isLoading) {
        return <WatchPageSkeleton />;
    }

    if (!video) {
        notFound();
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <SiteHeader />
            <main className="flex-1 md:py-8">
                <div className="container mx-auto max-w-4xl">
                    <div className="aspect-video mb-4 md:rounded-lg overflow-hidden">
                        <VideoPlayer youtubeId={video.youtubeVideoId} videoUrl={video.videoUrl} key={video.id} />
                    </div>
                     <div className="px-4 md:px-0">
                        <h1 className="text-2xl md:text-3xl font-bold font-headline mb-4">{video.title}</h1>
                        <p className="text-muted-foreground mb-4">{video.description}</p>
                         <div className="flex items-center gap-2 mt-4">
                            <p className="text-sm font-medium">Related topics</p>
                            <Link href="/category/News"><Badge variant="outline">#news</Badge></Link>
                            <Link href="/category/Technology"><Badge variant="outline">#technology</Badge></Link>
                            <Link href="/category/Sports"><Badge variant="outline">#sports</Badge></Link>
                        </div>
                        <div className="mt-8">
                            <Link href="/">
                                <Button>Back to Home</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
