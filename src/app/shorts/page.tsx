
'use client';

import SiteHeader from '../../components/site-header';
import { useCollection, useFirebase, useMemoFirebase } from '../../firebase';
import type { Short } from '../../lib/types';
import { collection, orderBy, query } from 'firebase/firestore';
import { Skeleton } from '../../components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { PlayCircle } from 'lucide-react';

function ShortsGridSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="aspect-[9/16] rounded-xl" />
            ))}
        </div>
    )
}

export default function ShortsGridPage() {
    const { firestore } = useFirebase();
    const shortsQuery = useMemoFirebase(() => query(collection(firestore, 'shorts'), orderBy('createdAt', 'desc')), [firestore]);
    const { data: shorts, isLoading } = useCollection<Short>(shortsQuery);

    return (
        <div className="flex min-h-screen w-full flex-col">
            <SiteHeader hideCategoryNav={true} />
            <main className="flex-1 py-8">
                <div className="container px-4 md:px-6">
                    <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">
                        Shorts
                    </h1>
                    {isLoading ? (
                        <ShortsGridSkeleton />
                    ) : shorts && shorts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {shorts.map(short => (
                                <Link href={`/shorts/${short.id}`} key={short.id} className="group relative block aspect-[9/16] overflow-hidden rounded-xl">
                                    <Image
                                        src={short.thumbnailUrl}
                                        alt={short.title}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        data-ai-hint="short video thumbnail"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <PlayCircle className="h-12 w-12 text-white/70 transition-all group-hover:text-white group-hover:scale-110" fill="currentColor" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                                        <h3 className="font-semibold text-white text-sm line-clamp-2">{short.title}</h3>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <h2 className="text-2xl font-semibold">No Shorts Yet</h2>
                            <p className="text-muted-foreground mt-2">Check back later for new short videos!</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
