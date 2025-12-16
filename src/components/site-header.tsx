

'use client';

import Link from 'next/link';
import {
  Search,
  Bell,
  Check,
  History,
  Settings,
  User,
  LogOut,
  Shield,
  PlusSquare,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
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
import { useState, useEffect } from 'react';
import { AuthDialog } from './auth-dialog';
import { useUser, useAuth, useFirebase, useCollection, useMemoFirebase, useDoc } from '../firebase';
import type { Video, Channel, UserProfile } from '../lib/types';
import { collection, query, where, limit, doc, orderBy, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { CategoryNav } from './category-nav';
import Image from 'next/image';
import Logo from '../app/POCKETNEWSLOGOlight.png';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';

const toDate = (timestamp: Timestamp | Date | string): Date => {
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    return new Date(timestamp);
};


export default function SiteHeader({ hideCategoryNav = false }: { hideCategoryNav?: boolean }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { firestore } = useFirebase();
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isPremiumDialogOpen, setIsPremiumDialogOpen] = useState(false);
  const router = useRouter(); 

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const recentVideosQuery = useMemoFirebase(() => {
    return query(
      collection(firestore, 'videos'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [firestore]);

  const { data: recentVideos } = useCollection<Video>(recentVideosQuery);
  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const { data: channels } = useCollection<Channel>(channelsQuery);
  
  const [showNotificationDot, setShowNotificationDot] = useState(false);

  useEffect(() => {
    // This effect runs only on the client side
    if (recentVideos && recentVideos.length > 0) {
      const latestVideoTimestamp = toDate(recentVideos[0].createdAt).getTime();
      const lastSeenTimestamp = localStorage.getItem('lastSeenVideoTimestamp');
      
      if (!lastSeenTimestamp || latestVideoTimestamp > parseInt(lastSeenTimestamp, 10)) {
        setShowNotificationDot(true);
      }
    }
  }, [recentVideos]);
  
  const handlePopoverOpen = (isOpen: boolean) => {
    if (isOpen && recentVideos && recentVideos.length > 0) {
      const latestVideoTimestamp = toDate(recentVideos[0].createdAt).getTime();
      localStorage.setItem('lastSeenVideoTimestamp', latestVideoTimestamp.toString());
      setShowNotificationDot(false);
    }
  };


  const handleLoginSuccess = () => {
    setIsAuthDialogOpen(false);
  };

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4 sm:px-6 md:px-8">
          <div className="mr-4 flex">
            <Link href="/" className="flex items-center space-x-2 p-2.5">
               <Image src={Logo} alt="Pocketnews TV" width={144} height={36} />
            </Link>
          </div>

          <div className="flex-1 flex justify-center items-center">
              <div className="relative w-full max-w-sm hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search news, topics, and channels" className="pl-9 bg-input" />
              </div>
          </div>
          
           <div className="flex items-center justify-end space-x-2">
              <Button variant="ghost" size="icon" className="md:hidden">
                <Search className="h-5 w-5" />
              </Button>
              <Popover onOpenChange={handlePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative" disabled={!user}>
                      <Bell className="h-5 w-5" />
                      {showNotificationDot && (
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
                          Recent uploads from all channels.
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
                                      <AvatarImage src={channel?.logoUrl} alt={channel?.name} />
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
                        {(userProfile?.isAdmin || userProfile?.isCreator) && (
                            <DropdownMenuItem onSelect={() => router.push('/creator')}>
                                <PlusSquare className="mr-2 h-4 w-4" />
                                <span>Creator Hub</span>
                            </DropdownMenuItem>
                        )}
                        {userProfile?.isAdmin && (
                            <DropdownMenuItem onSelect={() => router.push('/admin')}>
                                <Shield className="mr-2 h-4 w-4" />
                                <span>Admin Panel</span>
                            </DropdownMenuItem>
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
          </div>
        </div>
        {!hideCategoryNav && <CategoryNav />}
      </header>
      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} onLoginSuccess={handleLoginSuccess} />
        <Dialog open={isPremiumDialogOpen} onOpenChange={setIsPremiumDialogOpen}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>Premium Membership Coming Soon!</DialogTitle>
                <DialogDescription>
                Get ready for an ad-free experience, exclusive content, and more. We're putting the final touches on our premium membership.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button onClick={() => setIsPremiumDialogOpen(false)}>OK</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
}
