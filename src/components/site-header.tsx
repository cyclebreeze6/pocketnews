'use client';

import Link from 'next/link';
import { Tv2, Search, Bell, MoreVertical, ChevronDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const navLinks = [
    { href: '/#my-headlines', label: 'My Headlines', active: true },
    { href: '/#breaking-news', label: 'Breaking News' },
    { href: '/#live-news', label: 'Live News' },
    { href: '/#podcasts', label: 'Podcasts' },
    { href: '/#world-news', label: 'World News' },
    { href: '/#local-news', label: 'Local News' },
    { href: '/#politics', label: 'Politics' },
    { href: '/#business-and-economy', label: 'Business and Economy' },
    { href: '/#technology', label: 'Technology' },
    { href: '/#health', label: 'Health' },
    { href: '/#climate-and-environment', label: 'Climate and Environment' },
    { href: '/#entertainment', label: 'Entertainment' },
    { href: '/#sports', label: 'Sports' },
    { href: '/#fashion-and-style', label: 'Fashion & Style' },
    { href: '/#culture-and-lifestyle', label: 'Culture & Lifestyle' },
    { href: '/#travel', label: 'Travel' },
    { href: '/#interviews-and-documentaries', label: 'Interviews & Documentaries' },
    { href: '/#short-clips', label: 'Short Clips' },
    { href: '/#weather', label: 'Weather' },
];

const VISIBLE_LINKS = 6;
const visibleLinks = navLinks.slice(0, VISIBLE_LINKS);
const hiddenLinks = navLinks.slice(VISIBLE_LINKS);


export default function SiteHeader() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const isLoggedIn = true; // Mock login state

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
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
                    <Bell className="h-4 w-4" />
                    <span className="sr-only">Notifications</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>New video in Tech Forward</DropdownMenuItem>
                  <DropdownMenuItem>Your subscription is expiring soon</DropdownMenuItem>
                  <DropdownMenuItem>Live event starting in 5 minutes</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {isLoggedIn ? (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="https://picsum.photos/seed/user2/100/100" alt="@shadcn" />
                          <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild><Link href="/dashboard">Dashboard</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link href="/following">Following</Link></DropdownMenuItem>
                      <DropdownMenuItem>Settings</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              ) : (
                <Button size="sm" asChild><Link href="/login">Get Started</Link></Button>
              )}
              
              <Button variant="ghost" size="icon" className="hidden sm:inline-flex"><MoreVertical className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="sm:hidden"><Search className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </header>
      <div className="sticky top-16 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 sm:px-6 md:px-8">
            <nav className="flex items-center justify-center space-x-6 py-2">
              {visibleLinks.map(link => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
                     link.active ? "text-foreground" : "text-muted-foreground",
                     "hidden md:inline-block"
                  )}
                >
                  {link.label}
                </Link>
              ))}
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-primary">
                    More
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {[...navLinks.slice(0, VISIBLE_LINKS).filter(l => !l.active), ...hiddenLinks].map(link => (
                     <DropdownMenuItem key={link.href} asChild>
                        <Link href={link.href}>{link.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
        </div>
      </div>
    </>
  );
}
