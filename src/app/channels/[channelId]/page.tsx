'use client';

import { useCollection, useDoc, useFirebase, useMemoFirebase } from '../../../firebase';
import { notFound, useParams } from 'next/navigation';
import SiteHeader from '../../../components/site-header';
import { VideoCard } from '../../../components/video-card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { collection, doc, query, where, orderBy } from 'firebase/firestore';
import type { Channel, Video, Short } from '../../../lib/types';
import { Tv, PlayCircle } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import Link from 'next/link';
import Image from 'next/image';

function ChannelPageSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1">
         <section className="w-full py-12 md:py-16 lg:py-20 bg-card/50 border-b">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center space-y-4 text-center">
                 <Skeleton className="w-24 h-24 rounded-full mb-4" />
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-6 w-2/3" />
              </div>
            </div>
          </section>
        <section className="w-full py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function CardSkeleton() {
    return (
        <div className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        </div>
    )
}


export default function ChannelPage() {
  const params = useParams();
  const channelId = params.channelId as string;
  const { firestore } = useFirebase();

  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

  const channelRef = useMemoFirebase(() => doc(firestore, 'channels', channelId), [firestore, channelId]);
  const videosQuery = useMemoFirebase(() => query(collection(firestore, 'videos'), where('channelId', '==', channelId), orderBy('createdAt', 'desc')), [firestore, channelId]);
  const shortsQuery = useMemoFirebase(() => query(collection(firestore, 'shorts'), where('channelId', '==', channelId)), [firestore, channelId]);

  const { data: channel, isLoading: channelLoading } = useDoc<Channel>(channelRef);
  const { data: channelVideos, isLoading: videosLoading } = useCollection<Video>(videosQuery);
  const { data: channelShorts, isLoading: shortsLoading } = useCollection<Short>(shortsQuery);
  
  if (channelLoading || videosLoading || shortsLoading) {
    return <ChannelPageSkeleton />
  }

  if (!channel) {
    notFound();
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1">
         <section className="w-full py-12 md:py-16 lg:py-20 bg-card/50 border-b">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center space-y-4 text-center">
                 <Avatar className="w-24 h-24 mb-4">
                  {channel.logoUrl ? <AvatarImage src={channel.logoUrl} alt={channel.name} /> : <Tv className="p-2 w-full h-full"/>}
                  <AvatarFallback>{channel.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none font-headline">
                  {channel.name}
                </h1>
                <div className="mx-auto max-w-[700px] text-sm text-card-foreground/80">
                  <p className="line-clamp-1">
                    {channel.description}
                  </p>
                  <Button variant="link" className="p-0 h-auto" onClick={() => setIsDescriptionOpen(true)}>
                    read more
                  </Button>
                </div>
              </div>
            </div>
          </section>
        <section className="w-full py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6">
            <Tabs defaultValue="videos" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
                <TabsTrigger value="videos">Videos</TabsTrigger>
                <TabsTrigger value="shorts">Shorts</TabsTrigger>
              </TabsList>
              <TabsContent value="videos">
                {channelVideos && channelVideos.length > 0 ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {channelVideos.map((video) => (
                            <VideoCard key={video.id} video={video} />
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-16">
                        <h2 className="text-2xl font-semibold">No Videos Yet</h2>
                        <p className="text-muted-foreground mt-2">This channel hasn't uploaded any videos. Check back later!</p>
                    </div>
                )}
              </TabsContent>
              <TabsContent value="shorts">
                 {channelShorts && channelShorts.length > 0 ? (
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {channelShorts.map(short => (
                            <Link href={`/shorts/${short.id}`} key={short.id} className="group relative block aspect-[9/16] overflow-hidden rounded-xl">
                                <Image
                                    src={short.thumbnailUrl}
                                    alt={short.title}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    data-ai-hint="short video thumbnail"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <PlayCircle className="h-12 w-12 text-white/70 transition-all group-hover:text-white group-hover:scale-110" fill="currentColor" />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                                    <h3 className="font-semibold text-white text-sm line-clamp-2">{short.title}</h3>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-16">
                        <h2 className="text-2xl font-semibold">No Shorts Yet</h2>
                        <p className="text-muted-foreground mt-2">This channel hasn't uploaded any shorts. Check back later!</p>
                    </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      <Dialog open={isDescriptionOpen} onOpenChange={setIsDescriptionOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{channel.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-6 text-sm" style={{ whiteSpace: 'pre-wrap' }}>
            {channel.description}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
