
'use client';

import { useUser, useDoc, useFirebase, useMemoFirebase } from '../../firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SiteHeader from '../../components/site-header';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '../../lib/types';
import { Skeleton } from '../../components/ui/skeleton';
import CreatorSidebar from '../../components/creator-sidebar';
import { SidebarProvider, SidebarInset } from '../../components/ui/sidebar';

function CreatorLoadingSkeleton() {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <SiteHeader hideCategoryNav={true} />
             <div className="flex flex-1">
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

function CreatorLayoutInner({ children }: { children: React.ReactNode }){
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
    const timer = setTimeout(() => {
        setIsLongLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const isLoading = isUserLoading || isProfileLoading || isLongLoading;

  useEffect(() => {
    if (!isLoading) {
        if (!user || !(userProfile?.isCreator || userProfile?.isAdmin)) {
            router.replace('/');
        }
    }
  }, [user, userProfile, isLoading, router]);

  if (isLoading || !(userProfile?.isCreator || userProfile?.isAdmin)) {
    return <CreatorLoadingSkeleton />;
  }

  return (
    <SidebarProvider>
        <div className="flex min-h-screen w-full flex-col">
        <SiteHeader hideCategoryNav={true} />
        <div className="flex flex-1">
            <CreatorSidebar />
            <SidebarInset>
                <main className="flex-1 p-6 md:p-8">{children}</main>
            </SidebarInset>
        </div>
        </div>
    </SidebarProvider>
  );
}


export default function CreatorLayout({ children }: { children: React.ReactNode }) {
    return <CreatorLayoutInner>{children}</CreatorLayoutInner>;
}
