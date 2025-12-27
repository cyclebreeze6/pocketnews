
'use client';

import { useCollection, useDoc, useFirebase, useMemoFirebase, useUser } from '../../firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Video, UserProfile, Collection, Category } from '../../lib/types';
import SiteHeader from '../../components/site-header';
import { VideoCard } from '../../components/video-card';
import { Button } from '../../components/ui/button';
import Link from 'next/link';
import { Skeleton } from '../../components/ui/skeleton';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Folder } from 'lucide-react';

function CollectionsSkeleton() {
  return (
    <div className="container px-4 md:px-6">
      <div className="flex justify-between items-center mb-8">
        <Skeleton className="h-10 w-1/3" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
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

  const collectionsQuery = useMemoFirebase(
    () => (user ? collection(firestore, 'users', user.uid, 'collections') : null),
    [user, firestore]
  );
  const { data: collections, isLoading: collectionsLoading } = useCollection<Collection>(collectionsQuery);

  const isLoading = isUserLoading || collectionsLoading;

  if (isLoading) {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <SiteHeader />
            <main className="flex-1 py-12 md:py-16">
                <CollectionsSkeleton />
            </main>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-16">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
              <h1 className="text-3xl font-bold tracking-tight font-headline">My Collections</h1>
               <Link href="/settings/collections">
                <Button variant="outline">Manage My Collections</Button>
              </Link>
            </div>
            
            {collections && collections.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {collections.map((collection) => (
                      <Link href={`/my-collections/${collection.id}`} key={collection.id}>
                        <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
                          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                            <Folder className="h-12 w-12 mb-4 text-primary"/>
                            <h2 className="font-semibold text-lg">{collection.name}</h2>
                            <p className="text-sm text-muted-foreground">{collection.categoryIds.length} categories</p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <h2 className="text-2xl font-semibold">No Collections Yet</h2>
                    <p className="text-muted-foreground mt-2">
                        You haven't created any collections. Get started by creating your first one.
                    </p>
                    <Link href="/settings/collections" className="mt-4 inline-block">
                        <Button>Create a Collection</Button>
                    </Link>
                </div>
            )}
          </div>
      </main>
    </div>
  );
}
