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
  const isSeedPage = pathname === '/admin/seed';

  useEffect(() => {
    // If it's the seed page, we don't need to check for admin status
    if (isSeedPage) return;

    if (!isLoading) {
      if (!user || !userProfile?.isAdmin) {
        router.push('/');
      }
    }
  }, [user, userProfile, isLoading, router, isSeedPage]);
  
  if (isLoading && !isSeedPage) {
    return <div className="flex h-screen items-center justify-center">Loading Admin...</div>;
  }

  if (!isSeedPage && !userProfile?.isAdmin) {
    // Don't render anything while redirecting for non-admins on protected pages
    return null; 
  }

  // Allow rendering for the seed page or for authenticated admins
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
