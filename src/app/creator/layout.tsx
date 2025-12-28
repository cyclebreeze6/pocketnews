
'use client';

import { useUser, useDoc, useFirebase, useMemoFirebase } from '../../firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SiteHeader from '../../components/site-header';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '../../lib/types';
import { Skeleton } from '../../components/ui/skeleton';
import CreatorSidebar from '../../components/creator-sidebar';

function CreatorLoadingSkeleton() {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <SiteHeader hideCategoryNav={true} />
             <div className="flex flex-1">
                <CreatorSidebar />
                <main className="flex-1 p-6 md:p-8">
                    <Skeleton className="h-8 w-1/3 mb-8" />
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                    </div>
                </main>
            </div>
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
  const [isLongLoading, setIsLongLoading] = useState(true);

  useEffect(() => {
    // Introduce a minimum loading time to avoid flashing content and ensure auth state is settled.
    const timer = setTimeout(() => {
        setIsLongLoading(false);
    }, 500); // A short delay of 500ms

    return () => clearTimeout(timer);
  }, []);

  const isLoading = isUserLoading || isProfileLoading || isLongLoading;

  useEffect(() => {
    // This effect runs only when loading is complete.
    if (!isLoading) {
        // If there's no authenticated user or the user profile doesn't indicate they are a creator or admin,
        // redirect them to the homepage.
        if (!user || !(userProfile?.isCreator || userProfile?.isAdmin)) {
            router.replace('/');
        }
    }
  }, [user, userProfile, isLoading, router]);

  // While loading is in progress, or if the user is not yet confirmed as a creator,
  // show the loading skeleton. This prevents rendering creator content prematurely.
  if (isLoading || !(userProfile?.isCreator || userProfile?.isAdmin)) {
    return <CreatorLoadingSkeleton />;
  }

  // Only render the full creator layout if loading is complete AND the user is confirmed as a creator.
  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader hideCategoryNav={true} />
      <div className="flex flex-1">
        <CreatorSidebar />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
