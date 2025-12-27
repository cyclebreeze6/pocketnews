
'use client';

import { useCollection, useDoc, useFirebase, useMemoFirebase, useUser } from '../../../firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Video, Collection, Category } from '../../../lib/types';
import SiteHeader from '../../../components/site-header';
import { VideoCard } from '../../../components/video-card';
import { notFound, useParams } from 'next/navigation';
import { Skeleton } from '../../../components/ui/skeleton';
import { useEffect } from 'react';

function CollectionPageSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <Skeleton className="h-10 w-1/2 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-[125px] w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CollectionPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const params = useParams();
  const collectionId = params.collectionId as string;

  // Step 1: Fetch the collection document first
  const collectionRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid, 'collections', collectionId) : null),
    [user, firestore, collectionId]
  );
  const { data: collectionData, isLoading: collectionLoading } = useDoc<Collection>(collectionRef);

  // Step 2: Conditionally create the videos query only when collection data is available
  const videosQuery = useMemoFirebase(() => {
    if (!collectionData || collectionData.categoryIds.length === 0) {
      return null; // Return null if no categories are selected to avoid an invalid query
    }
    return query(
      collection(firestore, 'videos'),
      where('contentCategory', 'in', collectionData.categoryIds)
    );
  }, [firestore, collectionData]);
  
  const { data: videos, isLoading: videosLoading } = useCollection<Video>(videosQuery);
  
  const isLoading = isUserLoading || collectionLoading || (collectionData && videosLoading);

  useEffect(() => {
    // Redirect if user is not logged in after auth check completes
    if (!isUserLoading && !user) {
      notFound();
    }
  }, [user, isUserLoading]);

  // If loading is finished and there's no collection data, the collection doesn't exist
  if (!collectionLoading && !collectionData) {
    notFound();
  }

  if (isLoading) {
    return <CollectionPageSkeleton />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">{collectionData?.name}</h1>
          {videos && videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-2xl font-semibold">No Videos Found</h2>
              <p className="text-muted-foreground mt-2">
                There are no videos matching the categories in this collection yet.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
