'use client';

import Link from 'next/link';
import {
  Tv2,
  Search,
  Clapperboard,
  MonitorPlay,
  ChevronDown,
  Bell,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { users, videos, channels } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';

const navLinks = [
  { href: '/', label: 'My Headlines' },
  { href: '/picks', label: "Editor's Picks" },
  { href: '/news', label: 'News' },
  { href: '/local', label: 'Local News' },
  { href: '/business', label: 'Business' },
  { href: '/scitech', label: 'SciTech' },
  { href: '/politics', label: 'Politics' },
  { href: '/entertainment', label: 'Entertainment' },
  { href: '/sports', label: 'Sports' },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const loggedInUser = users[0]; // Mock logged-in user

  const followedChannels = ['1']; // Mock followed channel IDs
  const recentVideos = videos
    .filter(
      (v) =>
        followedChannels.includes(v.channelId) &&
        new Date(v.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ) // in last 7 days
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 sm:px-6 md:px-8">
          <div className="flex h-16 items-center">
            <div className="mr-4 flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <svg
                  role="img"
                  width="24"
                  height="24"
                  viewBox="0 0 512 512"
                  fill="hsl(var(--foreground))"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Haystack News</title>
                  <path d="M512 368.5V213.25h-59.5V368.5zM294.5 368.5v-274H235V368.5zM452.5 368.5V273h-59.5v95.5zM353 368.5V153.5h-58.5V368.5zM175.5 368.5V243h-59V368.5zM116.5 368.5V123h-59v245.5zM57.5 368.5V183h-59v185.5zM0 368.5V308h57.5v60.5zm195.1-322.25L175.5 67.5V0h119v67.5l-19.6-21.25-40.15-43.5z" />
                </svg>
                <span className="font-bold font-headline ml-2 text-lg">
                  Pocketnews TV
                </span>
              </Link>
            </div>
            <div className="flex flex-1 items-center justify-end space-x-2">
              <div className="relative w-full max-w-sm hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search" className="pl-9 bg-input" />
              </div>

              <nav className="hidden md:flex items-center space-x-2">
                <Link href="/channels">
                  <Button variant="ghost" size="sm">
                    <MonitorPlay className="h-4 w-4 mr-2" /> All channels
                  </Button>
                </Link>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {recentVideos.length > 0 && (
                        <span className="absolute top-1 right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">
                          Notifications
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Recent uploads from channels you follow.
                        </p>
                      </div>
                       <Separator />
                      <div className="grid gap-2">
                        {recentVideos.length > 0 ? (
                          recentVideos.map((video) => {
                            const channel = channels.find(c => c.id === video.channelId);
                            return (
                               <Link href={`/watch/${video.id}`} key={video.id}>
                                <div
                                  
                                  className="flex items-start gap-4 p-2 -mx-2 rounded-lg hover:bg-accent"
                                >
                                  <Avatar className="h-8 w-8 mt-1">
                                      <AvatarImage src={`https://picsum.photos/seed/${channel?.id}/40/40`} alt={channel?.name} />
                                      <AvatarFallback>{channel?.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="grid gap-1">
                                      <p className="text-sm font-medium leading-none">
                                        New video from{' '}
                                        <span className="font-bold">
                                          {channel?.name}
                                        </span>
                                      </p>
                                      <p className="text-sm text-muted-foreground line-clamp-2">
                                        {video.title}
                                      </p>
                                  </div>
                                </div>
                              </Link>
                            )
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No new notifications.
                          </p>
                        )}
                      </div>
                       <Separator />
                       <Button variant="ghost" size="sm" className="w-full">
                          <Check className="mr-2 h-4 w-4" /> Mark all as read
                       </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button size="sm">Get Started</Button>
              </nav>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      <div className="sticky top-16 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 sm:px-6 md:px-8">
          <ScrollArea className="w-full whitespace-nowrap">
            <nav className="flex w-max items-center justify-center space-x-6 py-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary whitespace-nowrap pb-2',
                    pathname === link.href
                      ? 'text-foreground border-b-2 border-destructive'
                      : 'text-muted-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="#"
                className="text-sm font-medium text-muted-foreground hover:text-primary whitespace-nowrap pb-2 flex items-center"
              >
                More categories <ChevronDown className="h-4 w-4 ml-1" />
              </Link>
            </nav>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}
