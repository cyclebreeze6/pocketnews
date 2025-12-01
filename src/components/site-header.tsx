'use client';

import Link from 'next/link';
import { Tv2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

export default function SiteHeader() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Tv2 className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">Pocketnews TV</span>
          </Link>
        </div>
        <nav className="flex flex-1 items-center space-x-4">
          <Link href="/#channels" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Channels
          </Link>
          <Link href="/#latest-videos" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Latest
          </Link>
        </nav>
        <div className="flex items-center justify-end space-x-4">
          <Button asChild>
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Admin Login
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
