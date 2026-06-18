'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, Clapperboard, Mic, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser } from '../firebase';
import { useState, type ComponentType, type MouseEvent, Suspense } from 'react';
import { AuthDialog } from './auth-dialog';

interface MobileNavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  isProtected: boolean;
  isActive: (pathname: string, tab: string | null) => boolean;
}

function MobileNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const activeTab = searchParams.get('tab');

  const navItems: MobileNavItem[] = [
    {
      href: '/',
      label: 'News',
      icon: Home,
      isProtected: false,
      isActive: (currentPath, tab) => (currentPath === '/' && tab !== 'podcast') || currentPath.startsWith('/watch') || currentPath.startsWith('/category') || currentPath.startsWith('/channels'),
    },
    {
      href: '/podcast/channels',
      label: 'Podcasts',
      icon: Mic,
      isProtected: false,
      isActive: (currentPath, tab) => currentPath.startsWith('/podcast'),
    },
    {
      href: '/shorts',
      label: 'Shorts',
      icon: Clapperboard,
      isProtected: false,
      isActive: (currentPath) => currentPath === '/shorts' || currentPath.startsWith('/shorts/'),
    },
    {
      href: '/settings/profile',
      label: 'Profile',
      icon: User,
      isProtected: true,
      isActive: (currentPath) => currentPath.startsWith('/settings'),
    },
  ];

  if (pathname.startsWith('/shorts/')) {
    return null;
  }

  const handleLinkClick = (e: MouseEvent, isProtected: boolean) => {
    if (isProtected && user?.isAnonymous) {
      e.preventDefault();
      setIsAuthDialogOpen(true);
    }
  };

  return (
    <>
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 pb-[env(safe-area-inset-bottom)]">
        <nav className="h-[4.5rem]">
          <ul className="grid h-full grid-cols-4 items-stretch">
            {navItems.map((item) => {
              const isActive = item.isActive(pathname, activeTab);
              return (
                <li key={item.label} className="h-full">
                  <Link
                    href={item.href}
                    onClick={(e) => handleLinkClick(e, item.isProtected)}
                    className={cn(
                      'relative flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground transition-colors active:scale-[0.98]',
                      isActive && 'text-primary'
                    )}
                  >
                    {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
                    <item.icon className="h-5 w-5" />
                    <span className="text-[11px] font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} onLoginSuccess={() => setIsAuthDialogOpen(false)} />
    </>
  );
}

export default function MobileNav() {
  return (
    <Suspense fallback={null}>
      <MobileNavContent />
    </Suspense>
  );
}
