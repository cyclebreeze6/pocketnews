
'use client';

import SiteHeader from '../../components/site-header';
import { useCollection, useFirebase, useMemoFirebase } from '../../firebase';
import type { Short } from '../../lib/types';
import { collection, orderBy, query } from 'firebase/firestore';
import { Skeleton } from '../../components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { PlayCircle, Search } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { useState } from 'react';

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
    const [searchTerm, setSearchTerm] = useState('');

    const filteredShorts = shorts?.filter(short => 
        short.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen w-full flex-col">
            <SiteHeader hideCategoryNav={true} />
            <main className="flex-1 py-8">
                <div className="container px-4 md:px-6">
                    <div className="relative w-full max-w-lg mx-auto mb-8">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search shorts..." 
                            className="pl-9 bg-input text-base"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {isLoading ? (
                        <ShortsGridSkeleton />
                    ) : filteredShorts && filteredShorts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredShorts.map(short => (
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
                            <h2 className="text-2xl font-semibold">No Shorts Found</h2>
                            <p className="text-muted-foreground mt-2">Try adjusting your search or check back later for new short videos!</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
