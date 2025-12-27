
'use client';

import { useCollection, useDoc, useFirebase, useMemoFirebase, useUser } from '../../firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Video, UserProfile } from '../../lib/types';
import SiteHeader from '../../components/site-header';
import { VideoCard } from '../../components/video-card';
import { Button } from '../../components/ui/button';
import Link from 'next/link';
import { Skeleton } from '../../components/ui/skeleton';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function CollectionsSkeleton() {
  return (
    <div className="container px-4 md:px-6">
      <div className="flex justify-between items-center mb-8">
        <Skeleton className="h-10 w-1/3" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function CardSkeleton() {
    return (
        <div className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        </div>
    )
}

export default function MyCollectionsPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);
  
  const preferredCategories = userProfile?.preferredCategories;

  const videosQuery = useMemoFirebase(
    () =>
      preferredCategories && preferredCategories.length > 0
        ? query(collection(firestore, 'videos'), where('contentCategory', 'in', preferredCategories))
        : null,
    [firestore, preferredCategories]
  );

  const { data: videos, isLoading: videosLoading } = useCollection<Video>(videosQuery);

  const isLoading = isUserLoading || profileLoading || videosLoading;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-16">
        {isLoading ? (
          <CollectionsSkeleton />
        ) : (
          <div className="container px-4 md:px-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
              <h1 className="text-3xl font-bold tracking-tight font-headline">My Collections</h1>
               <Link href="/settings/collections">
                <Button variant="outline">Customize My Collections</Button>
              </Link>
            </div>
            
            {preferredCategories && preferredCategories.length > 0 ? (
                videos && videos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {videos.map((video) => (
                            <VideoCard key={video.id} video={video} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <h2 className="text-2xl font-semibold">No Videos Found</h2>
                        <p className="text-muted-foreground mt-2">
                           We couldn't find any videos matching your selected categories.
                        </p>
                        <Link href="/settings/collections" className="mt-4 inline-block">
                          <Button>Select Different Categories</Button>
                        </Link>
                    </div>
                )
            ) : (
                <div className="text-center py-16">
                    <h2 className="text-2xl font-semibold">Customize Your Collections</h2>
                    <p className="text-muted-foreground mt-2">
                        You haven't selected any categories yet. Customize your collections to see your favorite content here.
                    </p>
                    <Link href="/settings/collections" className="mt-4 inline-block">
                        <Button>Get Started</Button>
                    </Link>
                </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

    