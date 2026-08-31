'use client';

import Link from 'next/link';
import { useCollection, useFirebase, useMemoFirebase, useUser, setDocumentNonBlocking, deleteDocumentNonBlocking, useDoc } from '../firebase';
import SiteHeader from '../components/site-header';
import { CategoryNav } from '../components/category-nav';
import { VideoPlayer } from '../components/video-player';
import { PodcastSection } from '../components/podcast-section';
import { IptvPlayer } from '../components/iptv-player';
import { fetchTdtChannelsFromSource, fetchTdtEpgFromSource, getCurrentEpgProgram } from '../lib/tdtchannels';
import { Badge } from '../components/ui/badge';
import Image from 'next/image';
import { ScrollArea } from '../components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../components/ui/button';
import { Share, Flag, PlayCircle, Copy, UserPlus, Loader2, UserCheck, Maximize2, Newspaper, Mic, Download, Tv, Radio, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Card, CardContent } from '../components/ui/card';
import type { Video, Channel, IptvChannel, EpgProgram } from '../lib/types';
import { collection, doc, serverTimestamp, Timestamp, query, orderBy, limit, where, getDocs, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { useToast } from '../hooks/use-toast';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../firebase';
import { AuthDialog } from '../components/auth-dialog';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '../lib/utils';
import { useIsMobile } from '../hooks/use-mobile';
import { useRegion } from '../context/region-context';
import { COUNTRY_TO_CONTINENT } from '../lib/region-map';
import { Input } from '../components/ui/input';

type ActiveTab = 'news' | 'live-tv' | 'podcast';

const AnimatedLiveDot = () => (
  <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 ml-1">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
    </span>
    LIVE
  </span>
);

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

function HomepageSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader hideCategoryNav={true} />
       <main className="flex-1 md:py-8">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 md:px-0">
          <div className="lg:col-span-2">
            <Skeleton className="aspect-video mb-4 md:rounded-lg" />
            <div className="px-4 md:px-0">
              <Skeleton className="h-8 w-3/4 mb-4" />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 px-4 md:px-0">
            <Skeleton className="h-6 w-1/2 mb-4" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 items-start p-2">
                  <Skeleton className="w-32 h-20 flex-shrink-0 rounded-md" />
                  <div className="flex-grow space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function Home() {
  const { firestore } = useFirebase();
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { selectedRegion } = useRegion();

  const [activeTab, setActiveTab] = useState<ActiveTab>('news');
  const [playingTab, setPlayingTab] = useState<ActiveTab>('news');
  const [newsVideoPlaying, setNewsVideoPlaying] = useState(true);

  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isPremiumDialogOpen, setIsPremiumDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');

  // News video queries & state
  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const { data: channels } = useCollection<Channel>(channelsQuery);

  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);

  // IPTV state
  const iptvQuery = useMemoFirebase(() => collection(firestore, 'iptv_channels'), [firestore]);
  const { data: firestoreIptvChannels } = useCollection<IptvChannel>(iptvQuery);
  const [fallbackIptvChannels, setFallbackIptvChannels] = useState<IptvChannel[]>([]);
  const [epgMap, setEpgMap] = useState<Record<string, EpgProgram[]>>({});
  const [selectedIptvChannel, setSelectedIptvChannel] = useState<IptvChannel | null>(null);
  const [iptvCategoryFilter, setIptvCategoryFilter] = useState<string>('all');
  const [iptvSearchQuery, setIptvSearchQuery] = useState<string>('');

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [isPlayerSticky, setIsPlayerSticky] = useState(false);

  // Combine Firestore IPTV channels with fallback TDTChannels source
  const iptvChannels = useMemo(() => {
    if (firestoreIptvChannels && firestoreIptvChannels.length > 0) {
      return firestoreIptvChannels;
    }
    return fallbackIptvChannels;
  }, [firestoreIptvChannels, fallbackIptvChannels]);

  // Load default fallback TDTChannels and EPG on mount
  useEffect(() => {
    async function loadTdtData() {
      try {
        const { tv, radio } = await fetchTdtChannelsFromSource();
        const combined = [...tv, ...radio];
        setFallbackIptvChannels(combined);

        const epgData = await fetchTdtEpgFromSource();
        setEpgMap(epgData);
      } catch (err) {
        console.error('Failed to load initial TDTChannels:', err);
      }
    }
    loadTdtData();
  }, []);

  // Set default selected IPTV channel
  useEffect(() => {
    if (iptvChannels.length > 0 && !selectedIptvChannel) {
      setSelectedIptvChannel(iptvChannels[0]);
    }
  }, [iptvChannels, selectedIptvChannel]);

  // Screen size check for Theater Mode
  useEffect(() => {
    const checkScreen = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const fetchVideos = useCallback(async (loadMore = false) => {
    const getQueryConstraints = () => {
        const constraints: any[] = [];
        
        if (selectedRegion && selectedRegion !== 'Global') {
          const searchRegions = [selectedRegion, 'Global'];
          const continent = COUNTRY_TO_CONTINENT[selectedRegion];
          if (continent && !searchRegions.includes(continent)) {
            searchRegions.push(continent);
          }
          constraints.push(where('regions', 'array-contains-any', searchRegions));
        }
        
        constraints.push(orderBy('createdAt', 'desc'));
        if (loadMore && lastVisible) {
            constraints.push(startAfter(lastVisible));
        }
        constraints.push(limit(10));
        return constraints;
    }

    if (loadMore) {
        if (isFetchingMore || !hasMore) return;
        setIsFetchingMore(true);
    } else {
        setIsLoading(true);
        setAllVideos([]);
    }

    try {
        const q = query(collection(firestore, 'videos'), ...getQueryConstraints());
        const documentSnapshots = await getDocs(q);

        const newVideos = documentSnapshots.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Video));

        setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1] || null);
        setHasMore(newVideos.length === 10);

        if (loadMore) {
            setAllVideos(prev => [...prev, ...newVideos]);
        } else {
            setAllVideos(newVideos);
            if (newVideos.length > 0) {
                const videoIdFromUrl = getVideoIdFromPath();
                const initialVideo = videoIdFromUrl ? newVideos.find(v => v.id === videoIdFromUrl) : newVideos[0];
                setCurrentVideo(initialVideo || newVideos[0]);
            }
        }
    } catch (error) {
        console.error("Error fetching videos:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to load videos." });
    } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
    }
  }, [firestore, selectedRegion, lastVisible, isFetchingMore, hasMore, toast]);

  useEffect(() => {
    fetchVideos();
  }, [selectedRegion]);

  useEffect(() => {
    const handleScroll = () => {
      if (playerContainerRef.current) {
        const { bottom } = playerContainerRef.current.getBoundingClientRect();
        setIsPlayerSticky(bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSetCurrentVideo = useCallback((video: Video) => {
    setCurrentVideo(video);
    setPlayingTab('news');
    if (!isTheaterMode) {
        const container = playerContainerRef.current?.parentElement;
        if(isPlayerSticky && container) {
            container.scrollIntoView({ behavior: 'smooth' });
        }
    }
    window.history.pushState({}, '', `/watch/${video.id}`);
  }, [isPlayerSticky, isTheaterMode]);
  
  useEffect(() => {
    const handlePopState = () => {
       if (allVideos.length > 0) {
         const videoIdFromUrl = getVideoIdFromPath();
         const videoToPlay = videoIdFromUrl ? allVideos.find(v => v.id === videoIdFromUrl) : allVideos[0];
         setCurrentVideo(videoToPlay || allVideos[0]);
       }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [allVideos]);

  const currentChannel = channels?.find((c) => c.id === currentVideo?.channelId);
  const followRef = useMemoFirebase(() => user && !user.isAnonymous && currentChannel ? doc(firestore, 'users', user.uid, 'followedChannels', currentChannel.id) : null, [firestore, user, currentChannel]);
  const { data: followDoc } = useDoc(followRef);
  const isFollowing = !!followDoc;

  useEffect(() => {
    if (currentVideo && user) {
        const historyRef = doc(firestore, 'users', user.uid, 'history', currentVideo.id);
        setDocumentNonBlocking(historyRef, {
          videoId: currentVideo.id,
          watchedAt: serverTimestamp(),
        }, { merge: true });
    }
  }, [currentVideo, user, firestore]);

  const handleNextVideo = useCallback(() => {
    if (!allVideos || !currentVideo) return;
    const currentIndex = allVideos.findIndex(v => v.id === currentVideo.id);
    if (currentIndex > -1 && currentIndex < allVideos.length - 1) {
      handleSetCurrentVideo(allVideos[currentIndex + 1]);
    }
  }, [allVideos, currentVideo, handleSetCurrentVideo]);

  const handlePreviousVideo = useCallback(() => {
    if (!allVideos || !currentVideo) return;
    const currentIndex = allVideos.findIndex(v => v.id === currentVideo.id);
    if (currentIndex > 0) {
      handleSetCurrentVideo(allVideos[currentIndex - 1]);
    }
  }, [allVideos, currentVideo, handleSetCurrentVideo]);
  
  const handleVideoEnd = handleNextVideo;
  
  const handleReportSubmit = () => {
    if (!user || !currentVideo) return;

    const reportRef = doc(collection(firestore, 'reports'));
    const reportData = {
        id: reportRef.id,
        videoId: currentVideo.id,
        videoTitle: currentVideo.title,
        userId: user.uid,
        reason: reportReason,
        details: reportDetails,
        createdAt: serverTimestamp(),
        status: 'Pending'
    };
    
    setDocumentNonBlocking(reportRef, reportData, {});
    toast({ title: 'Report submitted', description: "Admin will review and follow through."});
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

  const handleFollowToggle = () => {
    if (!user || !currentChannel) return;
    if (user.isAnonymous) {
        setIsAuthDialogOpen(true);
        return;
    }

    const followDocRef = doc(firestore, 'users', user.uid, 'followedChannels', currentChannel.id);
    if (isFollowing) {
        deleteDocumentNonBlocking(followDocRef);
        toast({ title: 'Unfollowed', description: `You've unfollowed ${currentChannel.name}.` });
    } else {
        setDocumentNonBlocking(followDocRef, { 
            channelId: currentChannel.id,
            followedAt: serverTimestamp() 
        }, {});
        toast({ title: 'Followed!', description: `You're now following ${currentChannel.name}.` });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTheaterMode) {
        setIsTheaterMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTheaterMode]);

  // Filter IPTV channels for Live TV tab (by country/region, category, search)
  const filteredIptvChannels = useMemo(() => {
    const list = iptvChannels.filter(ch => {
      const regionMatch = !selectedRegion || selectedRegion === 'Global' ||
        (ch.country && ch.country.toLowerCase() === selectedRegion.toLowerCase()) ||
        (ch.country && ch.country.toLowerCase().includes(selectedRegion.toLowerCase()));

      const categoryMatch = iptvCategoryFilter === 'all' 
        ? true 
        : iptvCategoryFilter === 'tv' ? ch.type === 'tv'
        : iptvCategoryFilter === 'radio' ? ch.type === 'radio'
        : ch.category?.toLowerCase() === iptvCategoryFilter.toLowerCase();

      const searchMatch = !iptvSearchQuery || 
        ch.name.toLowerCase().includes(iptvSearchQuery.toLowerCase()) || 
        ch.category.toLowerCase().includes(iptvSearchQuery.toLowerCase()) ||
        (ch.country && ch.country.toLowerCase().includes(iptvSearchQuery.toLowerCase()));

      return regionMatch && categoryMatch && searchMatch;
    });

    return list.length > 0 ? list : iptvChannels;
  }, [iptvChannels, selectedRegion, iptvCategoryFilter, iptvSearchQuery]);

  const currentIptvIndex = useMemo(() => {
    return filteredIptvChannels.findIndex(ch => ch.id === selectedIptvChannel?.id);
  }, [filteredIptvChannels, selectedIptvChannel]);

  const handlePrevIptvChannel = useCallback(() => {
    if (filteredIptvChannels.length === 0) return;
    if (currentIptvIndex > 0) {
      setSelectedIptvChannel(filteredIptvChannels[currentIptvIndex - 1]);
    } else {
      setSelectedIptvChannel(filteredIptvChannels[filteredIptvChannels.length - 1]);
    }
  }, [currentIptvIndex, filteredIptvChannels]);

  const handleNextIptvChannel = useCallback(() => {
    if (filteredIptvChannels.length === 0) return;
    if (currentIptvIndex >= 0 && currentIptvIndex < filteredIptvChannels.length - 1) {
      setSelectedIptvChannel(filteredIptvChannels[currentIptvIndex + 1]);
    } else {
      setSelectedIptvChannel(filteredIptvChannels[0]);
    }
  }, [currentIptvIndex, filteredIptvChannels]);

  if (isLoading && allVideos.length === 0) {
      return <HomepageSkeleton />;
  }

  const currentIndex = allVideos?.findIndex(v => v.id === currentVideo?.id) ?? -1;
  const hasNext = currentIndex > -1 && currentIndex < (allVideos?.length ?? 0) - 1;
  const hasPrevious = currentIndex > 0;

  // Selected IPTV EPG Program
  const selectedIptvEpgProgram = selectedIptvChannel?.epgId 
    ? getCurrentEpgProgram(epgMap[selectedIptvChannel.epgId]) 
    : null;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader hideCategoryNav={true} />

      {/* ── Tab Navigation Bar ──────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/60">
        <div className="container mx-auto px-4">
          <div className="flex items-end gap-1 sm:gap-2">
            {/* Tab 1: Youtube Live */}
            <button
              onClick={() => {
                setActiveTab('news');
                setPlayingTab('news');
                setNewsVideoPlaying(true);
              }}
              className={cn(
                'relative flex items-center gap-2 px-4 sm:px-5 py-3.5 text-sm font-semibold transition-all',
                activeTab === 'news'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Newspaper className="h-4 w-4 text-red-400" />
              Youtube Live
              {playingTab === 'news' && <AnimatedLiveDot />}
              {activeTab === 'news' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>

            {/* Tab 2: LIVE TV */}
            <button
              onClick={() => {
                setActiveTab('live-tv');
                setPlayingTab('live-tv');
                setNewsVideoPlaying(false);
              }}
              className={cn(
                'relative flex items-center gap-2 px-4 sm:px-5 py-3.5 text-sm font-semibold transition-all',
                activeTab === 'live-tv'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Tv className="h-4 w-4 text-cyan-400" />
              LIVE TV
              {playingTab === 'live-tv' && <AnimatedLiveDot />}
              {activeTab === 'live-tv' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-t-full" />
              )}
            </button>

            {/* Tab 3: Podcast */}
            <button
              onClick={() => {
                setActiveTab('podcast');
                setPlayingTab('podcast');
                setNewsVideoPlaying(false);
              }}
              className={cn(
                'relative flex items-center gap-2 px-4 sm:px-5 py-3.5 text-sm font-semibold transition-all',
                activeTab === 'podcast'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Mic className="h-4 w-4 text-purple-400" />
              Podcast
              {playingTab === 'podcast' && <AnimatedLiveDot />}
              {activeTab === 'podcast' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-t-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Category nav — only for News tab */}
      {activeTab === 'news' && <CategoryNav />}

      <main ref={mainRef} className="flex-1">
        {/* ── NEWS AGGREGATOR TAB ──────────────────────────────────── */}
        <div className={activeTab === 'news' ? 'block' : 'hidden'}>
          <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 md:px-0 md:py-8">
            <div className={cn("lg:col-span-2", isTheaterMode && "z-[100]")}>
               {allVideos.length === 0 ? (
                   <div className="aspect-video bg-muted md:rounded-lg flex flex-col items-center justify-center text-center p-8">
                      <h2 className="text-2xl font-bold mb-2">No Videos Found</h2>
                      <p className="text-muted-foreground">
                          Try adjusting your region filter.
                      </p>
                  </div>
              ) : currentVideo && currentChannel ? (
                <>
                  <div 
                    className={cn(
                      "relative md:rounded-lg overflow-hidden",
                      isTheaterMode && "fixed inset-0 z-[100] bg-black md:rounded-none"
                    )}
                  >
                    <div
                      ref={playerContainerRef}
                      className={cn(
                        'z-40 w-full bg-background group',
                        isTheaterMode ? 'h-full' : 'h-auto',
                        isPlayerSticky && isMobile && !isTheaterMode
                          ? 'fixed top-0 left-0 right-0 shadow-lg'
                          : 'relative'
                      )}
                    >
                      <div className={cn("aspect-video", isTheaterMode && "h-full")}>
                        <VideoPlayer
                          youtubeId={currentVideo.youtubeVideoId}
                          videoUrl={currentVideo.videoUrl}
                          onEnd={handleVideoEnd}
                          onNext={handleNextVideo}
                          onPrevious={handlePreviousVideo}
                          hasNext={hasNext}
                          hasPrevious={hasPrevious}
                          isTheaterMode={isTheaterMode}
                          onToggleTheater={isLargeScreen ? () => setIsTheaterMode(!isTheaterMode) : undefined}
                          playing={newsVideoPlaying}
                          key={currentVideo.id}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 md:px-0">
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight font-headline mb-4">
                      {currentVideo.title}
                    </h1>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 border-y border-border/40">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarImage src={currentChannel.logoUrl} alt={currentChannel.name} />
                          <AvatarFallback>{currentChannel.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold text-sm leading-none flex items-center gap-2">
                            {currentChannel.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(toDate(currentVideo.createdAt))} ago
                          </p>
                        </div>
                        <Button 
                            variant={isFollowing ? "secondary" : "default"} 
                            size="sm" 
                            onClick={handleFollowToggle}
                            className="ml-2 h-8 text-xs font-semibold"
                        >
                            {isFollowing ? <UserCheck className="h-3.5 w-3.5 mr-1" /> : <UserPlus className="h-3.5 w-3.5 mr-1" />}
                            {isFollowing ? "Following" : "Follow"}
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleShare('facebook')}>
                          <FacebookIcon className="h-4 w-4 mr-1 text-blue-500" /> Share
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleShare('whatsapp')}>
                          <WhatsAppIcon className="h-4 w-4 mr-1 text-green-500" /> WhatsApp
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleShare('copy')}>
                          <Copy className="h-4 w-4 mr-1" /> Copy Link
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setIsReportDialogOpen(true)}>
                          <Flag className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Sidebar Up Next */}
            <div className="lg:col-span-1 px-4 md:px-0">
              <h2 className="text-lg font-bold mb-4 font-headline flex items-center justify-between">
                Up Next News
              </h2>
              <ScrollArea className="h-[calc(100vh-280px)] pr-4">
                  <div className="space-y-4">
                      {allVideos.map((video) => {
                          const isPlaying = video.id === currentVideo?.id;
                          const videoChannel = channels?.find(c => c.id === video.channelId);
                          return (
                          <div
                              key={video.id}
                              onClick={() => handleSetCurrentVideo(video)}
                              className={cn(
                              "group flex gap-3 items-start cursor-pointer p-2 rounded-lg transition-colors",
                              isPlaying ? "bg-accent/80 border border-primary/30" : "hover:bg-accent/40"
                              )}
                          >
                              <div className="relative w-36 aspect-video rounded-md overflow-hidden flex-shrink-0 bg-muted">
                                  <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                                  {isPlaying && (
                                      <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                                          <PlayCircle className="text-white h-6 w-6" />
                                      </div>
                                  )}
                              </div>
                              <div className="flex-grow min-w-0">
                                  <h3 className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-primary">{video.title}</h3>
                                  <p className="text-xs text-muted-foreground mt-1">{videoChannel?.name} • {formatDistanceToNow(toDate(video.createdAt))} ago</p>
                              </div>
                          </div>
                          )
                      })}
                  </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* ── LIVE TV TAB (Cloned structure for IPTV & EPG) ───────── */}
        <div className={activeTab === 'live-tv' ? 'block' : 'hidden'}>
          <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 md:px-0 md:py-8">
            <div className="lg:col-span-2">
              {selectedIptvChannel ? (
                <>
                  <IptvPlayer
                    channel={selectedIptvChannel}
                    currentProgram={selectedIptvEpgProgram}
                    onPlayStateChange={(playing) => {
                      if (playing) setPlayingTab('live-tv');
                    }}
                  />

                  <div className="p-4 md:px-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-border/40">
                      <div className="flex items-center gap-3">
                        {selectedIptvChannel.logoUrl ? (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border bg-muted p-1 flex-shrink-0">
                            <Image src={selectedIptvChannel.logoUrl} alt={selectedIptvChannel.name} fill className="object-contain" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg border border-border bg-muted flex items-center justify-center flex-shrink-0">
                            {selectedIptvChannel.type === 'radio' ? <Radio className="h-6 w-6" /> : <Tv className="h-6 w-6" />}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight font-headline">
                              {selectedIptvChannel.name}
                            </h1>
                            <Badge variant="outline" className="text-xs uppercase bg-primary/10 text-primary border-primary/30">
                              {selectedIptvChannel.type} • {selectedIptvChannel.category}
                            </Badge>
                          </div>
                          {selectedIptvEpgProgram && (
                            <p className="text-sm text-cyan-400 font-medium mt-1">
                              Now Airing: <span className="text-foreground">{selectedIptvEpgProgram.title}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handlePrevIptvChannel}
                          className="flex items-center gap-1 text-xs border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-400"
                        >
                          <ChevronLeft className="h-4 w-4" /> Previous
                        </Button>

                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleNextIptvChannel}
                          className="flex items-center gap-1 text-xs border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-400"
                        >
                          Next <ChevronRight className="h-4 w-4" />
                        </Button>

                        {selectedIptvChannel.web && (
                          <Button variant="outline" size="sm" onClick={() => window.open(selectedIptvChannel.web, '_blank')}>
                            Official Website
                          </Button>
                        )}
                      </div>
                    </div>

                    {selectedIptvEpgProgram?.description && (
                      <div className="mt-4 p-4 rounded-lg bg-card/60 border border-border/40 text-sm text-muted-foreground leading-relaxed">
                        <h4 className="font-bold text-foreground text-xs uppercase tracking-wider mb-1">Program Details</h4>
                        {selectedIptvEpgProgram.description}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="aspect-video bg-muted md:rounded-lg flex flex-col items-center justify-center p-8 text-center">
                  <Tv className="w-12 h-12 text-muted-foreground mb-3" />
                  <h3 className="text-xl font-bold mb-1">No IPTV Stream Selected</h3>
                  <p className="text-sm text-muted-foreground">Select a channel from the right sidebar to start watching live.</p>
                </div>
              )}
            </div>

            {/* LIVE TV & Radio Channel Sidebar */}
            <div className="lg:col-span-1 px-4 md:px-0">
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold font-headline flex items-center gap-2">
                    <Tv className="h-5 w-5 text-cyan-400" />
                    Live Channels ({filteredIptvChannels.length})
                  </h2>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {['all', 'tv', 'radio', 'generalistas', 'noticias', 'deportes'].map((cat) => (
                    <Button
                      key={cat}
                      size="sm"
                      variant={iptvCategoryFilter === cat ? 'default' : 'outline'}
                      onClick={() => setIptvCategoryFilter(cat)}
                      className="text-xs uppercase py-1 px-2.5 h-7 flex-shrink-0"
                    >
                      {cat === 'all' ? 'All' : cat}
                    </Button>
                  ))}
                </div>

                {/* Search channel */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search channel or genre..."
                    value={iptvSearchQuery}
                    onChange={(e) => setIptvSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
              </div>

              <ScrollArea className="h-[calc(100vh-320px)] pr-2">
                <div className="space-y-2">
                  {filteredIptvChannels.map((ch) => {
                    const isSelected = selectedIptvChannel?.id === ch.id;
                    const program = ch.epgId ? getCurrentEpgProgram(epgMap[ch.epgId]) : null;

                    return (
                      <div
                        key={ch.id}
                        onClick={() => {
                          setSelectedIptvChannel(ch);
                          setPlayingTab('live-tv');
                        }}
                        className={cn(
                          "group flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border",
                          isSelected
                            ? "bg-cyan-500/10 border-cyan-500/50 shadow-md"
                            : "bg-card/40 border-border/30 hover:bg-accent/60"
                        )}
                      >
                        <div className="relative w-11 h-11 rounded-md overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center flex-shrink-0">
                          {ch.logoUrl ? (
                            <Image src={ch.logoUrl} alt={ch.name} fill className="object-contain p-1" />
                          ) : (
                            ch.type === 'radio' ? <Radio className="h-5 w-5 text-purple-400" /> : <Tv className="h-5 w-5 text-cyan-400" />
                          )}
                        </div>

                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h3 className={cn("text-sm font-semibold truncate", isSelected ? "text-cyan-400 font-bold" : "text-foreground")}>
                              {ch.name}
                            </h3>
                            <Badge variant="outline" className="text-[9px] uppercase px-1 py-0 border-white/10 text-muted-foreground flex-shrink-0">
                              {ch.type}
                            </Badge>
                          </div>

                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {program ? program.title : ch.category}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {filteredIptvChannels.length === 0 && (
                    <p className="text-xs text-center text-muted-foreground py-8">
                      No channels match search filter.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* ── PODCAST TAB ────────────────────────────────────────── */}
        <div className={activeTab === 'podcast' ? 'block' : 'hidden'}>
          <PodcastSection isActive={activeTab === 'podcast'} />
        </div>
      </main>
      
      {/* Disclaimer Footer */}
      <footer className="py-12 border-t border-border/40 text-center text-sm text-muted-foreground bg-card/20">
        <div className="container mx-auto px-4">
          <p className="mb-4 font-semibold text-foreground">Meet the #1 App to Stream News, Live TV &amp; Podcasts. Watch Free!</p>
          <div className="max-w-3xl mx-auto space-y-2 opacity-70">
            <p>
              Disclaimer: All video and audio content, logos, and trademarks displayed on this platform belong to their respective owners and original channels.
            </p>
            <p>
              PocketStream is a free curation platform providing centralised access to public news broadcasts, live TV feeds, and podcast episodes.
            </p>
          </div>
          <div className="mt-8 pt-8 border-t border-border/10 space-y-3">
            <p>© {new Date().getFullYear()} PocketStream. All rights reserved.</p>
            <div className="flex justify-center">
              <a
                href="/apk/app-debug.apk"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                Download Android APK
              </a>
            </div>
            <div className="flex justify-center gap-6">
              <Link href="/terms" className="hover:text-foreground hover:underline transition-colors">Terms &amp; Conditions</Link>
              <Link href="/privacy" className="hover:text-foreground hover:underline transition-colors">Privacy Policy</Link>
              <a href="mailto:ads@pocketnewstv.com" className="hover:text-foreground hover:underline transition-colors">Advertise With Us</a>
            </div>
          </div>
        </div>
      </footer>

      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} onLoginSuccess={() => setIsAuthDialogOpen(false)} />
      <Dialog open={isPremiumDialogOpen} onOpenChange={setIsPremiumDialogOpen}>
        <DialogContent>
        <DialogHeader>
            <DialogTitle>Premium Membership Coming Soon!</DialogTitle>
            <DialogDescription>
            Get ready for an ad-free experience, exclusive content, and more.
            </DialogDescription>
        </DialogHeader>
        <DialogFooter>
            <Button onClick={() => setIsPremiumDialogOpen(false)}>OK</Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
