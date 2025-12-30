'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clapperboard, Package, History, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser } from '../firebase';
import { useState } from 'react';
import { AuthDialog } from './auth-dialog';

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Home', icon: Home, isProtected: false },
    { href: '/shorts', label: 'Shorts', icon: Clapperboard, isProtected: false },
    { href: '/my-collections', label: 'Collections', icon: Package, isProtected: true },
    { href: '/history', label: 'History', icon: History, isProtected: true },
    { href: '/settings/profile', label: 'Profile', icon: User, isProtected: true },
  ];

  if (pathname.startsWith('/shorts/')) {
    return null;
  }

  const handleLinkClick = (e: React.MouseEvent, isProtected: boolean) => {
    if (isProtected && user?.isAnonymous) {
      e.preventDefault();
      setIsAuthDialogOpen(true);
    }
  };

  return (
    <>
      <div className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-50">
        <nav className="h-full">
          <ul className="h-full flex justify-around items-center">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.label} className="h-full">
                  <Link
                    href={item.href}
                    onClick={(e) => handleLinkClick(e, item.isProtected)}
                    className={cn(
                      'flex flex-col items-center justify-center h-full w-16 text-muted-foreground transition-colors',
                      isActive && 'text-primary'
                    )}
                  >
                    <item.icon className="h-6 w-6 mb-1" />
                    <span className="text-xs">{item.label}</span>
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
