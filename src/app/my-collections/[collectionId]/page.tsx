
'use client';

import { useDoc, useFirebase, useMemoFirebase, useUser } from '../../../firebase';
import { doc } from 'firebase/firestore';
import type { Collection } from '../../../lib/types';
import SiteHeader from '../../../components/site-header';
import { notFound, useParams } from 'next/navigation';
import { Skeleton } from '../../../components/ui/skeleton';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Folder } from 'lucide-react';

function CollectionPageSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <Skeleton className="h-10 w-1/2 mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
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

  const collectionRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid, 'collections', collectionId) : null),
    [user, firestore, collectionId]
  );
  const { data: collectionData, isLoading: collectionLoading } = useDoc<Collection>(collectionRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      notFound();
    }
  }, [user, isUserLoading]);

  const isLoading = isUserLoading || collectionLoading;
  
  if (isLoading) {
    return <CollectionPageSkeleton />;
  }

  if (!collectionData) {
    notFound();
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">{collectionData?.name}</h1>
          {collectionData.categoryIds && collectionData.categoryIds.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {collectionData.categoryIds.map((categoryName) => (
                <Link href={`/category/${encodeURIComponent(categoryName)}`} key={categoryName}>
                    <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                        <Folder className="h-12 w-12 mb-3 text-primary"/>
                        <h2 className="font-semibold text-base">{categoryName}</h2>
                        </CardContent>
                    </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-2xl font-semibold">Empty Collection</h2>
              <p className="text-muted-foreground mt-2">
                This collection has no categories. You can add some in the settings.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
