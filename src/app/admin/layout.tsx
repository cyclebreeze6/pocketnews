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

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const isLoading = isUserLoading || isProfileLoading;
  
  useEffect(() => {
    // Wait until all loading is complete before checking permissions.
    if (!isLoading) {
      // Allow access to the seed page for initial setup if the user is logged in.
      if (pathname === '/admin/seed' && user) {
        return;
      }
      
      // If profile is loaded and the user is not an admin, redirect.
      if (!userProfile?.isAdmin) {
        router.push('/');
      }
    }
  }, [user, userProfile, isLoading, router, pathname]);
  
  // Show a loading indicator while we verify admin status.
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Verifying Admin Access...</div>;
  }

  // After loading, if the user is confirmed not to be an admin (and not on the seed page),
  // they will be redirected by the useEffect. Return null to prevent content flash.
  if (!userProfile?.isAdmin && pathname !== '/admin/seed') {
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
