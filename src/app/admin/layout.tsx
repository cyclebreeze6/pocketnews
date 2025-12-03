'use client';

import { useUser, useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SiteHeader from '@/components/site-header';
import AdminSidebar from '@/components/admin-sidebar';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { firestore } = useFirebase();

  // Memoize the document reference to the user's profile.
  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  
  // Fetch the user's profile data.
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const isLoading = isUserLoading || (user && isProfileLoading);

  useEffect(() => {
    // Wait until loading is complete.
    if (!isLoading) {
      // If there's no logged-in user at all, redirect to home.
      if (!user) {
        router.push('/');
        return;
      }
      
      // If the user profile is loaded and the user is NOT an admin, redirect.
      // This check is now safe because it only runs after isProfileLoading is false.
      if (userProfile && !userProfile.isAdmin) {
        router.push('/');
      }
      
      // Also handle the case where the profile might not exist for some reason,
      // but we have a user object. This is a fallback to prevent access.
      if (user && !userProfile) {
         // If we are still loading the profile, don't redirect yet.
        if (isProfileLoading) return;
        // If loading is finished and there's no profile, they can't be an admin.
        router.push('/');
      }
    }
  }, [user, userProfile, isLoading, isProfileLoading, router]);

  // Show a loading screen while we verify the user and their admin status.
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Verifying Admin Access...</div>;
  }

  // If after loading, the user is still not confirmed as an admin, they will have been
  // redirected by the useEffect. Return null to prevent any flash of admin content.
  if (!userProfile?.isAdmin) {
    return null;
  }
  
  // If all checks pass, render the admin layout.
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
