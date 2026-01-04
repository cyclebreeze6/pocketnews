

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Video } from '../../../lib/types';
import SiteHeader from '../../../components/site-header';
import { VideoPlayer } from '../../../components/video-player';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import Link from 'next/link';

// Helper to initialize the admin app idempotently
async function initializeAdminApp() {
    if (getApps().length > 0) {
        return;
    }
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY && process.env.FIREBASE_SERVICE_ACCOUNT_KEY.startsWith('{')) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            initializeApp({
                credential: cert(serviceAccount),
            });
        } catch (e) {
            console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is set but not valid JSON. Falling back to default credentials.", e);
            initializeApp();
        }
    } else {
        initializeApp();
    }
}

async function getVideo(videoId: string): Promise<Video | null> {
    await initializeAdminApp();
    const firestore = getFirestore();
    const videoRef = firestore.collection('videos').doc(videoId);
    const videoSnap = await videoRef.get();

    if (!videoSnap.exists) {
        return null;
    }
    return { id: videoSnap.id, ...videoSnap.data() } as Video;
}

type Props = {
    params: { videoId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const video = await getVideo(params.videoId);

    if (!video) {
        return {
            title: 'Video Not Found',
        };
    }

    return {
        title: video.title,
        description: video.description,
        openGraph: {
            title: video.title,
            description: video.description,
            type: 'video.other',
            images: [
                {
                    url: video.thumbnailUrl,
                    width: 1280,
                    height: 720,
                    alt: video.title,
                },
            ],
            url: `/watch/${video.id}`,
        },
        twitter: {
            card: 'summary_large_image',
            title: video.title,
            description: video.description,
            images: [video.thumbnailUrl],
        },
    };
}

export default async function WatchPage({ params }: Props) {
    const video = await getVideo(params.videoId);

    if (!video) {
        notFound();
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <SiteHeader />
            <main className="flex-1 md:py-8">
                <div className="container mx-auto max-w-4xl">
                    <div className="aspect-video mb-4 md:rounded-lg overflow-hidden">
                        <VideoPlayer youtubeId={video.youtubeVideoId} key={video.id} />
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
