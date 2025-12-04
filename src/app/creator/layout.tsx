
'use client';

import { useUser, useDoc, useFirebase, useMemoFirebase } from '../../firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SiteHeader from '../../components/site-header';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '../../lib/types';
import { Skeleton } from '../../components/ui/skeleton';

function CreatorLoadingSkeleton() {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <SiteHeader hideCategoryNav={true} />
            <main className="flex-1 p-6 md:p-8 container">
                <Skeleton className="h-8 w-1/3 mb-8" />
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
            </main>
      </div>
    )
}

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  
  const isLoading = isUserLoading;

  useEffect(() => {
    // Wait until loading is done.
    if (isLoading) {
      return; 
    }

    // After loading, if there's no user, redirect.
    if (!user) {
      router.replace('/');
    }

  }, [user, isLoading, router]);

  // If we are still loading, or if there is no user yet, show the loading skeleton.
  if (isLoading || !user) {
    return <CreatorLoadingSkeleton />;
  }

  // Only if loading is complete AND the user is logged in, render the layout.
  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader hideCategoryNav={true} />
      <main className="flex-1 p-6 md:p-8 container">{children}</main>
    </div>
  );
}
