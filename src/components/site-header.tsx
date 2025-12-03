
'use client';

import Link from 'next/link';
import {
  Search,
  MonitorPlay,
  Bell,
  Check,
  History,
  Settings,
  User,
  LogOut,
  Shield,
  Video as VideoIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useState } from 'react';
import { AuthDialog } from './auth-dialog';
import { useUser, useAuth, useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import type { Video, Channel, UserFollow, UserProfile } from '@/lib/types';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';


export default function SiteHeader() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { firestore } = useFirebase();
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const router = useRouter(); // Use useRouter for navigation

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const followsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'follows') : null, [firestore, user]);
  const { data: followedChannels } = useCollection<UserFollow>(followsQuery);

  const recentVideosQuery = useMemoFirebase(() => {
    if (!followedChannels || followedChannels.length === 0) return null;
    const followedChannelIds = followedChannels.map(f => f.channelId);
    return query(
      collection(firestore, 'videos'),
      where('channelId', 'in', followedChannelIds),
      // where('createdAt', '>', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), // Last 7 days
      limit(5) // Limit notifications
    );
  }, [firestore, followedChannels]);

  const { data: recentVideos } = useCollection<Video>(recentVideosQuery);
  const { data: channels } = useCollection<Channel>(useMemoFirebase(() => collection(firestore, 'channels'), [firestore]));

  const handleLoginSuccess = () => {
    setIsAuthDialogOpen(false);
  };

  const handleLogout = () => {
    auth.signOut();
  };

  // Function to navigate to the Add Video page
  const goToAddVideo = () => {
    router.push('/admin/videos');
  };


  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 sm:px-6 md:px-8">
          <div className="flex h-16 items-center">
            <div className="flex items-center">
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
            
            <div className="flex-1 flex justify-center items-center">
                <div className="relative w-full max-w-sm hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search" className="pl-9 bg-input" />
                </div>
            </div>

            <div className="flex items-center justify-end space-x-2">
              <nav className="hidden md:flex items-center space-x-2">
                <Link href="/channels">
                  <Button variant="ghost" size="sm">
                    <MonitorPlay className="h-4 w-4 mr-2" /> All channels
                  </Button>
                </Link>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative" disabled={!user}>
                      <Bell className="h-5 w-5" />
                      {recentVideos && recentVideos.length > 0 && (
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
                        {recentVideos && recentVideos.length > 0 ? (
                          recentVideos.map((video) => {
                            const channel = channels?.find(c => c.id === video.channelId);
                            return (
                               <Link href={`/watch/${video.id}`} key={video.id}>
                                <div
                                  
                                  className="flex items-start gap-4 p-2 -mx-2 rounded-lg hover:bg-accent"
                                >
                                  <Avatar className="h-8 w-8 mt-1">
                                      <AvatarImage src={`https://picsum.photos/seed/${channel?.id}/40/40`} alt={channel?.name} />
                                      <AvatarFallback>{channel?.name?.charAt(0)}</AvatarFallback>
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

                {!isUserLoading && (
                   user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photoURL || `https://avatar.vercel.sh/${user.uid}.png`} alt={user.displayName || 'User'} />
                          <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{userProfile?.displayName || 'Anonymous User'}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                        {userProfile?.isAdmin && (
                          <>
                            <DropdownMenuItem onSelect={() => router.push('/admin')}>
                                <Shield className="mr-2 h-4 w-4" />
                                <span>Admin Panel</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={goToAddVideo}>
                                <VideoIcon className="mr-2 h-4 w-4" />
                                <span>Add Video</span>
                            </DropdownMenuItem>
                          </>
                        )}
                      <DropdownMenuItem asChild>
                        <Link href="/history"><History className="mr-2 h-4 w-4" /><span>Watch History</span></Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings/profile"><User className="mr-2 h-4 w-4" /><span>Profile</span></Link>
                      </DropdownMenuItem>
                       <DropdownMenuItem asChild>
                        <Link href="/settings"><Settings className="mr-2 h-4 w-4" /><span>Settings</span></Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button size="sm" onClick={() => setIsAuthDialogOpen(true)}>Get Started</Button>
                )
                )}
              </nav>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} onLoginSuccess={handleLoginSuccess} />
    </>
  );
}
