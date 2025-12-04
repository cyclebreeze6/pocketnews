
'use client';

import { useUser, useDoc, useFirebase, useMemoFirebase } from '../../firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SiteHeader from '../../components/site-header';
import AdminSidebar from '../../components/admin-sidebar';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '../../lib/types';
import { Skeleton } from '../../components/ui/skeleton';


function AdminLoadingSkeleton() {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <SiteHeader />
            <div className="flex flex-1">
                <AdminSidebar />
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


export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
  // show the loading skeleton. This prevents rendering the admin content prematurely.
  if (isLoading || !userProfile?.isAdmin) {
    return <AdminLoadingSkeleton />;
  }

  // Only if loading is complete AND the user is a confirmed admin, render the layout.
  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}

    