
'use client';

import SiteHeader from '../../components/site-header';
import { useCollection, useFirebase, useMemoFirebase } from '../../firebase';
import type { Short } from '../../lib/types';
import { collection, orderBy, query, limit, startAfter, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { Skeleton } from '../../components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { PlayCircle, Search, Loader2 } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';

function ShortsGridSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="aspect-[9/16] rounded-xl" />
            ))}
        </div>
    )
}

const SHORTS_PER_PAGE = 10;

export default function ShortsGridPage() {
    const { firestore } = useFirebase();
    const [searchTerm, setSearchTerm] = useState('');
    
    // State for paginated shorts
    const [shorts, setShorts] = useState<Short[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);
    
    // This hook is now just for filtering the already-loaded data
    const allShortsFromDBQuery = useMemoFirebase(() => query(collection(firestore, 'shorts'), orderBy('createdAt', 'desc')), [firestore]);
    const { data: allShortsFromDB } = useCollection<Short>(allShortsFromDBQuery);


    const fetchShorts = async () => {
        setIsLoading(true);
        try {
            const firstBatch = query(collection(firestore, 'shorts'), orderBy('createdAt', 'desc'), limit(SHORTS_PER_PAGE));
            const documentSnapshots = await getDocs(firstBatch);

            const newShorts = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Short));
            setShorts(newShorts);

            const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            setLastVisible(lastDoc);
            
            setHasMore(newShorts.length === SHORTS_PER_PAGE);

        } catch (error) {
            console.error("Error fetching shorts:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const fetchMoreShorts = async () => {
      if (!hasMore || isFetchingMore) return;

      setIsFetchingMore(true);
      try {
        const nextBatch = query(
          collection(firestore, 'shorts'), 
          orderBy('createdAt', 'desc'), 
          startAfter(lastVisible), 
          limit(SHORTS_PER_PAGE)
        );
        const documentSnapshots = await getDocs(nextBatch);
        
        const newShorts = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Short));
        setShorts(prev => [...prev, ...newShorts]);
        
        const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
        setLastVisible(lastDoc);
        
        setHasMore(newShorts.length === SHORTS_PER_PAGE);

      } catch (error) {
          console.error("Error fetching more shorts:", error);
      } finally {
          setIsFetchingMore(false);
      }
    };

    // Initial fetch
    useEffect(() => {
        fetchShorts();
    }, []);
    

    const filteredShorts = searchTerm
        ? allShortsFromDB?.filter(short => short.title.toLowerCase().includes(searchTerm.toLowerCase()))
        : shorts;
        
    const displayShorts = searchTerm ? filteredShorts : shorts;

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
                    ) : displayShorts && displayShorts.length > 0 ? (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {displayShorts.map(short => (
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
                             {hasMore && !searchTerm && (
                                <div className="text-center mt-8">
                                    <Button onClick={fetchMoreShorts} disabled={isFetchingMore}>
                                        {isFetchingMore ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Loading...</>
                                        ) : 'Load More'}
                                    </Button>
                                </div>
                            )}
                        </>
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
