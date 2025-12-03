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
    // Wait until loading is complete before running checks
    if (!isLoading) {
      // Allow access to seed page for any logged-in user for initial setup
      if (pathname === '/admin/seed' && user) {
        return;
      }
      
      // For all other admin pages, require admin status
      if (!userProfile?.isAdmin) {
        router.push('/');
      }
    }
  }, [user, userProfile, isLoading, router, pathname]);
  
  // While loading, show a loading indicator for all admin pages
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading Admin...</div>;
  }

  // After loading, if user is not an admin and it's not the (now accessible) seed page, they will be redirected.
  // We can return null to prevent a flash of content.
  if (!userProfile?.isAdmin && pathname !== '/admin/seed') {
    return null; 
  }
  
  // Render the admin layout for admins, or for any user on the seed page.
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
