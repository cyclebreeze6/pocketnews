'use client';

import { useUser, useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import SiteHeader from '@/components/site-header';
import AdminSidebar from '@/components/admin-sidebar';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';


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
  const pathname = usePathname();
  const { firestore } = useFirebase();

  // Memoize the document reference to the user's profile.
  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  
  // Fetch the user's profile data.
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  // If we're on the seed page, don't run any of the auth checks and return early.
  if (pathname === '/admin/seed') {
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

  // Combined loading state: still loading if the initial user check is running,
  // or if we have a user but are still waiting for their specific profile to load.
  const isLoading = isUserLoading || (!!user && isProfileLoading);

  useEffect(() => {
    // This effect runs when loading states or user data change.
    // If it's still loading, we don't need to do anything yet.
    if (isLoading) {
      return;
    }

    // If loading is finished:
    // 1. If there's no user object, or
    // 2. If there IS a user, but they don't have an admin profile,
    // then redirect to the homepage.
    if (!user || !userProfile?.isAdmin) {
      router.push('/');
    }

  }, [user, userProfile, isLoading, router]);

  // While we are checking for the user and their profile, show a loading screen or skeleton.
  if (isLoading) {
    return <AdminLoadingSkeleton />;
  }

  // If loading is complete and the user is an admin, render the admin layout.
  // The useEffect above will handle redirection for non-admins.
  if (user && userProfile?.isAdmin) {
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

  // This fallback will show briefly while the redirection is happening for non-admins.
  return <AdminLoadingSkeleton />;
}
