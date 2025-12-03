'use client';

import { useUser, useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import SiteHeader from '@/components/site-header';
import AdminSidebar from '@/components/admin-sidebar';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

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

  // Combined loading state
  const isLoading = isUserLoading || (user && isProfileLoading);

  useEffect(() => {
    // This effect runs when loading states or user data change.
    // If it's still loading, we don't need to do anything yet.
    if (isLoading) {
      return;
    }

    // If loading is finished:
    // 1. If there's no user object, redirect to home.
    if (!user) {
      router.push('/');
      return;
    }

    // 2. If there IS a user, but their profile hasn't loaded or they are not an admin, redirect.
    if (!userProfile || !userProfile.isAdmin) {
      router.push('/');
    }

  }, [user, userProfile, isLoading, router]);

  // While we are checking for the user and their profile, show a loading screen.
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Verifying Admin Access...</div>;
  }

  // If loading is complete and the user has been verified as an admin, render the layout.
  // The useEffect above will have handled the redirection for non-admins.
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

  // Fallback: if not loading and not an admin, render nothing while redirecting.
  return null;
}
