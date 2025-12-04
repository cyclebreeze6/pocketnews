
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
  const { firestore } = useFirebase();

  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const isLoading = isUserLoading || isProfileLoading;

  useEffect(() => {
    // Wait until all loading is done.
    if (isLoading) {
      return; 
    }

    // After loading, if there's no user or the user is not an admin, redirect.
    if (!user || !userProfile?.isAdmin) {
      router.replace('/');
    }

  }, [user, userProfile, isLoading, router]);

  // If we are still loading, or if the user is not a confirmed admin yet,
  // show the loading skeleton. This prevents rendering the creator content prematurely.
  if (isLoading || !userProfile?.isAdmin) {
    return <CreatorLoadingSkeleton />;
  }

  // Only if loading is complete AND the user is a confirmed admin, render the layout.
  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader hideCategoryNav={true} />
      <main className="flex-1 p-6 md:p-8 container">{children}</main>
    </div>
  );
}
