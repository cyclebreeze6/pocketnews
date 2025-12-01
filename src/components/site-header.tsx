'use client';

import Link from 'next/link';
import { Tv2, LogIn, Search, AppWindow, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';

export default function SiteHeader() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Tv2 className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">Pocketnews TV</span>
          </Link>
        </div>
        <nav className="hidden md:flex flex-1 items-center space-x-4">
          <Link href="/#my-headlines" className="text-sm font-medium text-foreground transition-colors hover:text-primary border-b-2 border-primary pb-1">
            My Headlines
          </Link>
          <Link href="/#editors-picks" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Editor's Picks
          </Link>
           <Link href="/#news" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            News
          </Link>
           <Link href="/#local" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Local News
          </Link>
        </nav>
        <div className="flex flex-1 md:flex-none items-center justify-end space-x-2">
           <div className="relative w-full max-w-xs hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-9 bg-input" />
           </div>
          <Button variant="outline" size="sm" className="hidden sm:inline-flex"><AppWindow className="mr-2 h-4 w-4" /> Get the App</Button>
          <Button size="sm">Get Started</Button>
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex"><MoreVertical className="h-4 w-4" /></Button>
           <Button variant="ghost" size="icon" className="sm:hidden"><Search className="h-4 w-4" /></Button>
        </div>
      </div>
    </header>
  );
}
