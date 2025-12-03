

'use client';

import SiteHeader from '../../components/site-header';
import { useCollection, useFirebase, useMemoFirebase, useUser, deleteDocumentNonBlocking } from '../../firebase';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../../components/ui/button';
import { Trash2, X } from 'lucide-react';
import { Separator } from '../../components/ui/separator';
import type { WatchHistory, Video, Channel } from '../../lib/types';
import { collection, doc } from 'firebase/firestore';

export default function HistoryPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  
  const historyQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'history') : null, [firestore, user]);
  const { data: historyItems, isLoading: historyLoading } = useCollection<WatchHistory>(historyQuery);

  const allVideosQuery = useMemoFirebase(() => collection(firestore, 'videos'), [firestore]);
  const { data: allVideos } = useCollection<Video>(allVideosQuery);

  const allChannelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const { data: allChannels } = useCollection<Channel>(allChannelsQuery);
  
  const historyVideos = historyItems
    ?.map(item => {
      const video = allVideos?.find(v => v.id === item.videoId);
      if (!video) return null;
      const channel = allChannels?.find(c => c.id === video.channelId);
      return { ...video, watchedAt: item.watchedAt, channelName: channel?.name };
    })
    .filter(Boolean)
    .sort((a, b) => (b!.watchedAt as any).seconds - (a!.watchedAt as any).seconds);

  const clearHistory = () => {
    if (user && historyItems) {
      historyItems.forEach(item => {
        const docRef = doc(firestore, 'users', user.uid, 'history', item.id);
        deleteDocumentNonBlocking(docRef);
      });
    }
  };

  const removeFromHistory = (videoId: string) => {
    if (user) {
      const docRef = doc(firestore, 'users', user.uid, 'history', videoId);
      deleteDocumentNonBlocking(docRef);
    }
  };


  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2">
                <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">
                    Watch History
                </h1>
                <div className="space-y-6">
                {historyLoading && <p>Loading history...</p>}
                {historyVideos && historyVideos.map((video) => {
                    if (!video) return null;
                    return (
                    <div key={video.id} className="group relative flex flex-col sm:flex-row gap-4 items-start">
                        <Link href={`/watch/${video.id}`} className="flex-shrink-0">
                             <div className="relative w-full sm:w-48 h-28">
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
                        </Link>
                        <div className="flex-grow">
                            <Link href={`/watch/${video.id}`}>
                                <h3 className="text-lg font-semibold line-clamp-2 leading-snug group-hover:text-primary">{video.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{video.channelName} • {formatDistanceToNow(new Date((video.watchedAt as any).seconds * 1000))} ago</p>
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{video.description}</p>
                            </Link>
                        </div>
                        <Button variant="ghost" size="icon" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100" onClick={() => removeFromHistory(video.id)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    );
                })}
                </div>
            </div>
             <div className="md:col-span-1">
                <h2 className="text-xl font-semibold mb-4">Manage History</h2>
                <Separator />
                <Button variant="ghost" className="w-full justify-start px-2 mt-4 text-destructive hover:text-destructive" onClick={clearHistory}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear all watch history
                </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
