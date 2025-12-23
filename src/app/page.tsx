

'use client';

import Link from 'next/link';
import { useCollection, useFirebase, useMemoFirebase, useUser, setDocumentNonBlocking, deleteDocumentNonBlocking, useDoc, addDocumentNonBlocking, updateDocumentNonBlocking } from '../firebase';
import SiteHeader from '../components/site-header';
import { VideoPlayer } from '../components/video-player';
import { Badge } from '../components/ui/badge';
import Image from 'next/image';
import { ScrollArea } from '../components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../components/ui/button';
import { Share, Flag, PlayCircle, Check, Copy, UserPlus, ListFilter, SlidersHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Card, CardContent } from '../components/ui/card';
import type { Video, Channel, UserProfile, Category } from '../lib/types';
import { collection, doc, serverTimestamp, Timestamp, query, orderBy, limit, where, collectionGroup } from 'firebase/firestore';
import { useToast } from '../hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { initiateAnonymousSignIn, useAuth } from '../firebase';
import { AuthDialog } from '../components/auth-dialog';
import { Checkbox } from '../components/ui/checkbox';
import { Separator } from '../components/ui/separator';


function toDate(timestamp: Timestamp | Date | string): Date {
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    return new Date(timestamp);
}

const getVideoIdFromPath = () => {
  if (typeof window === 'undefined') return null;
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (pathParts[0] === 'watch' && pathParts[1]) {
    return pathParts[1];
  }
  return null;
};

const FacebookIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const WhatsAppIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
);


export default function Home() {
  const { firestore } = useFirebase();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isPremiumDialogOpen, setIsPremiumDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isCustomizeDialogOpen, setIsCustomizeDialogOpen] = useState(false);
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  
  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const categoriesQuery = useMemoFirebase(() => collection(firestore, 'categories'), [firestore]);
  
  const { data: channels, isLoading: channelsLoading } = useCollection<Channel>(channelsQuery);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);


  // Main video query logic
  const videosQuery = useMemoFirebase(() => {
    const baseQuery = collectionGroup(firestore, 'videos');
    const hasCategoryPrefs = userProfile?.preferredCategories && userProfile.preferredCategories.length > 0;
    const hasChannelPrefs = userProfile?.preferredChannels && userProfile.preferredChannels.length > 0;

    // If user has preferences for either, filter by them
    if (hasCategoryPrefs || hasChannelPrefs) {
      const filters = [];
      if (hasCategoryPrefs) {
        filters.push(where('contentCategory', 'in', userProfile.preferredCategories));
      }
      if (hasChannelPrefs) {
        filters.push(where('channelId', 'in', userProfile.preferredChannels));
      }
      // Note: Firestore does not support 'OR' queries on different fields.
      // This query will find videos matching EITHER a category OR a channel if we had a single field.
      // For now, we'll just query by categories if they exist, otherwise by channels, or latest if none.
      // A more robust solution might involve client-side merging or denormalizing data.
      if (hasCategoryPrefs) {
        return query(baseQuery, where('contentCategory', 'in', userProfile.preferredCategories), orderBy('createdAt', 'desc'), limit(20));
      }
      if (hasChannelPrefs) {
         return query(baseQuery, where('channelId', 'in', userProfile.preferredChannels), orderBy('createdAt', 'desc'), limit(20));
      }
    }
    
    // Otherwise, get the latest videos from all categories
    return query(baseQuery, orderBy('createdAt', 'desc'), limit(20));

  }, [firestore, userProfile]);
  
  const { data: videos, isLoading: videosLoading } = useCollection<Video>(videosQuery);
  
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  
  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);

  useEffect(() => {
    if (userProfile) {
        setSelectedCategories(userProfile.preferredCategories || []);
        setSelectedChannels(userProfile.preferredChannels || []);
    }
  }, [userProfile]);

  useEffect(() => {
    if (videos && videos.length > 0 && !currentVideo) {
      const videoIdFromUrl = getVideoIdFromPath();
      const videoToPlay = videoIdFromUrl ? videos.find(v => v.id === videoIdFromUrl) : videos[0];
      setCurrentVideo(videoToPlay || videos[0]);
    }
  }, [videos, currentVideo]);

  const handleSetCurrentVideo = useCallback((video: Video) => {
    setCurrentVideo(video);
    window.history.pushState({}, '', `/watch/${video.id}`);
  }, []);
  
  useEffect(() => {
    const handlePopState = () => {
       if (videos) {
         const videoIdFromUrl = getVideoIdFromPath();
         const videoToPlay = videoIdFromUrl ? videos.find(v => v.id === videoIdFromUrl) : videos[0];
         setCurrentVideo(videoToPlay || videos[0]);
       }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [videos]);


  const currentChannel = channels?.find((c) => c.id === currentVideo?.channelId);
  const otherVideos = videos;

  useEffect(() => {
    if (currentVideo && user) {
        const historyRef = doc(firestore, 'users', user.uid, 'history', currentVideo.id);
        setDocumentNonBlocking(historyRef, {
          videoId: currentVideo.id,
          watchedAt: serverTimestamp(),
        }, { merge: true });
    }
  }, [currentVideo, user, firestore]);

  const handleVideoEnd = () => {
    if (!videos || !currentVideo) return;
    const currentIndex = videos.findIndex(v => v.id === currentVideo.id);
    if (currentIndex > -1 && currentIndex < videos.length - 1) {
      handleSetCurrentVideo(videos[currentIndex + 1]);
    }
  }
  
  const handleReportSubmit = () => {
    toast({ title: 'Report submitted', description: "Admin will review and follow through, thank you for your understanding"});
    setIsReportDialogOpen(false);
    setReportReason('');
    setReportDetails('');
  };

  const handleShare = (platform: 'facebook' | 'whatsapp' | 'copy') => {
    if (!currentVideo) return;
    const videoUrl = `${window.location.origin}/watch/${currentVideo.id}`;
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(currentVideo.title + ' ' + videoUrl)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(videoUrl);
        toast({ title: "Link copied to clipboard!" });
        break;
    }
  };

  const handleCustomizeSave = () => {
    if (userProfileRef) {
        updateDocumentNonBlocking(userProfileRef, {
            preferredCategories: selectedCategories,
            preferredChannels: selectedChannels,
        });
        toast({ title: "Your headlines have been updated!" });
        setIsCustomizeDialogOpen(false);
    }
  };
  
  const isLoading = videosLoading || channelsLoading || isUserLoading || isProfileLoading || categoriesLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading your headlines...</p>
        </main>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <SiteHeader />
        <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <h2 className="text-2xl font-bold mb-4">Your Headlines are Empty</h2>
            <p className="text-muted-foreground mb-6">
              Select your favorite topics to build your personalized news feed.
            </p>
            <Button onClick={() => setIsCustomizeDialogOpen(true)}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Customize My Headlines
            </Button>
        </main>
      </div>
    );
  }

  if (!currentVideo || !currentChannel || !otherVideos) {
     return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading video details...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 md:py-8">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 md:px-0">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="aspect-video mb-4 md:rounded-lg overflow-hidden md:mx-0 -mx-4">
              <VideoPlayer youtubeId={currentVideo.youtubeVideoId} onEnd={handleVideoEnd} key={currentVideo.id} />
            </div>
            
            <div className="px-4 md:px-0">
                <h2 className="text-2xl md:text-3xl font-bold font-headline mb-4">{currentVideo.title}</h2>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={currentChannel?.logoUrl || `https://picsum.photos/seed/${currentChannel?.id}/40/40`} alt={currentChannel?.name} />
                            <AvatarFallback>{currentChannel?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{currentChannel?.name}</p>
                            <p className="text-sm text-muted-foreground">{formatDistanceToNow(toDate(currentVideo.createdAt))} ago</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant={'outline'} onClick={() => {
                              if (user?.isAnonymous) {
                                setIsAuthDialogOpen(true);
                              } else {
                                setIsPremiumDialogOpen(true)
                              }
                            }}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Follow
                        </Button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="secondary"><Share className="mr-2 h-4 w-4" /> Share</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2">
                                <div className="flex gap-2">
                                    <Button size="icon" variant="outline" onClick={() => handleShare('facebook')}>
                                        <FacebookIcon className="h-5 w-5" />
                                    </Button>
                                     <Button size="icon" variant="outline" onClick={() => handleShare('whatsapp')}>
                                        <WhatsAppIcon className="h-5 w-5" />
                                    </Button>
                                    <Button size="icon" variant="outline" onClick={() => handleShare('copy')}>
                                        <Copy className="h-5 w-5" />
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                         <Button variant="secondary" onClick={() => {
                              if (user?.isAnonymous) {
                                setIsAuthDialogOpen(true);
                              } else {
                                setIsReportDialogOpen(true);
                              }
                            }}>
                            <Flag className="mr-2 h-4 w-4" /> Report
                        </Button>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                    <p className="text-sm font-medium">Related topics</p>
                    <Link href="/category/News"><Badge variant="outline">#news</Badge></Link>
                    <Link href="/category/Technology"><Badge variant="outline">#technology</Badge></Link>
                    <Link href="/category/Sports"><Badge variant="outline">#sports</Badge></Link>
                </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1 px-4 md:px-0">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-muted-foreground">My Headlines</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsCustomizeDialogOpen(true)}>
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Customize
                </Button>
            </div>


            <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                <div className="space-y-4">
                    {otherVideos.map((video) => {
                        const videoChannel = channels.find(c => c.id === video.channelId);
                        const isPlaying = video.id === currentVideo.id;
                        return (
                        <div onClick={() => handleSetCurrentVideo(video)} key={video.id} className="cursor-pointer group flex gap-4 items-start p-2 rounded-lg hover:bg-card/80">
                            <div className="relative w-32 h-20 flex-shrink-0">
                                <Image
                                src={video.thumbnailUrl}
                                alt={video.title}
                                fill
                                className="rounded-md object-cover"
                                />
                                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-sm">
                                  {Math.floor(video.views / 60000)}:{String(Math.floor((video.views % 60000)/1000)).padStart(2,'0')}
                                </div>
                            </div>
                            <div className="flex-grow">
                                {isPlaying && (
                                    <Badge variant="default" className="mb-1 text-xs animate-pulse">
                                        <PlayCircle className="mr-1 h-3 w-3" />
                                        Now Playing
                                    </Badge>
                                )}
                                <h3 className="text-sm font-semibold line-clamp-3 leading-snug group-hover:text-primary">{video.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{videoChannel?.name} • {formatDistanceToNow(toDate(video.createdAt))} ago</p>
                            </div>
                        </div>
                        )
                    })}
                </div>
            </ScrollArea>
             <Card className="mt-8 bg-card/50">
                <CardContent className="p-4 flex items-center justify-between">
                    <p className="text-sm max-w-[200px]">Enjoy ad-free news from 400+ local, national, and global channels</p>
                    <Button variant="secondary" onClick={() => setIsPremiumDialogOpen(true)}>Go ad-free</Button>
                </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        Meet the #1 App to Stream News. Watch Free!
      </footer>
       <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} onLoginSuccess={() => setIsAuthDialogOpen(false)} />
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

      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Video</DialogTitle>
            <DialogDescription>
              Why are you reporting this video? Your report is anonymous.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="report-reason">Reason</Label>
                <Select onValueChange={setReportReason} value={reportReason}>
                    <SelectTrigger id="report-reason">
                        <SelectValue placeholder="Select a reason..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Copyright">Copyright</SelectItem>
                        <SelectItem value="Wrong Information">Wrong Information</SelectItem>
                        <SelectItem value="False News">False News</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="report-details">Details (optional)</Label>
                <Textarea id="report-details" value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="Provide additional details..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleReportSubmit}>Report Video</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCustomizeDialogOpen} onOpenChange={setIsCustomizeDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Customize My Headlines</DialogTitle>
                <DialogDescription>
                Select your favorite channels and categories to personalize your feed.
                </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto space-y-6 p-1">
                <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Categories</h4>
                    <div className="space-y-2">
                    {categories?.map(category => (
                        <div key={category.id} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`cat-${category.id}`} 
                                checked={selectedCategories.includes(category.name)}
                                onCheckedChange={(checked) => {
                                    setSelectedCategories(prev => checked ? [...prev, category.name] : prev.filter(c => c !== category.name))
                                }}
                            />
                            <Label htmlFor={`cat-${category.id}`} className="cursor-pointer">{category.name}</Label>
                        </div>
                    ))}
                    </div>
                </div>

                <Separator />

                <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Channels</h4>
                    <div className="space-y-2">
                    {channels?.map(channel => (
                        <div key={channel.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`chan-${channel.id}`}
                                checked={selectedChannels.includes(channel.id)}
                                onCheckedChange={(checked) => {
                                    setSelectedChannels(prev => checked ? [...prev, channel.id] : prev.filter(c => c !== channel.id))
                                }}
                            />
                            <Label htmlFor={`chan-${channel.id}`} className="cursor-pointer">{channel.name}</Label>
                        </div>
                    ))}
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsCustomizeDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCustomizeSave}>Save Preferences</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
