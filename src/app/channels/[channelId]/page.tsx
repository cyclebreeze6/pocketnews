
'use client';

import { useCollection, useDoc, useFirebase, useMemoFirebase } from '../../../firebase';
import { notFound, useParams } from 'next/navigation';
import SiteHeader from '../../../components/site-header';
import { VideoCard } from '../../../components/video-card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { collection, doc, query, where } from 'firebase/firestore';
import type { Channel, Video } from '../../../lib/types';
import { Tv } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';

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

  const channelRef = useMemoFirebase(() => doc(firestore, 'channels', channelId), [firestore, channelId]);
  const videosQuery = useMemoFirebase(() => query(collection(firestore, 'videos'), where('channelId', '==', channelId)), [firestore, channelId]);

  const { data: channel, isLoading: channelLoading } = useDoc<Channel>(channelRef);
  const { data: channelVideos, isLoading: videosLoading } = useCollection<Video>(videosQuery);
  
  if (channelLoading || videosLoading) {
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
                <p className="mx-auto max-w-[700px] text-card-foreground/80 md:text-xl">
                  {channel.description}
                </p>
              </div>
            </div>
          </section>
        <section className="w-full py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6">
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
          </div>
        </section>
      </main>
    </div>
  );
}
