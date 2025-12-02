'use client';

import Link from 'next/link';
import { Tv2, Search, Clapperboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/channels', label: 'Channels' },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 sm:px-6 md:px-8">
          <div className="flex h-16 items-center">
            <div className="mr-4 flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Tv2 className="h-6 w-6 text-primary" />
                <span className="font-bold font-headline">Pocketnews TV</span>
              </Link>
            </div>
            <div className="flex flex-1 md:flex-none items-center justify-end space-x-2 ml-auto">
              <div className="relative w-full max-w-xs hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search" className="pl-9 bg-input" />
              </div>
              <Button variant="ghost" size="icon" className="sm:hidden"><Search className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </header>
      <div className="sticky top-16 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 sm:px-6 md:px-8">
            <ScrollArea className="w-full whitespace-nowrap">
              <nav className="flex w-max items-center justify-center space-x-6 py-2">
                {navLinks.map(link => (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap pb-2",
                       pathname === link.href
                         ? "text-foreground border-b-2 border-primary" 
                         : "text-muted-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </ScrollArea>
        </div>
      </div>
    </>
  );
}
