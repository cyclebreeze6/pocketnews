'use client';

import { useCollection, useDoc, useFirebase, useMemoFirebase } from '../../../firebase';
import { notFound } from 'next/navigation';
import SiteHeader from '../../../components/site-header';
import { VideoCard } from '../../../components/video-card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { collection, doc, query, where } from 'firebase/firestore';
import type { Channel, Video } from '../../../lib/types';
import { Tv } from 'lucide-react';

export default function ChannelPage({ params }: { params: { channelId: string } }) {
  const { firestore } = useFirebase();

  const channelRef = useMemoFirebase(() => doc(firestore, 'channels', params.channelId), [firestore, params.channelId]);
  const videosQuery = useMemoFirebase(() => query(collection(firestore, 'videos'), where('channelId', '==', params.channelId)), [firestore, params.channelId]);

  const { data: channel, isLoading: channelLoading } = useDoc<Channel>(channelRef);
  const { data: channelVideos, isLoading: videosLoading } = useCollection<Video>(videosQuery);
  
  if (channelLoading || videosLoading) {
    return <div>Loading...</div>
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
                <p className="col-span-full text-center text-muted-foreground">No videos in this channel yet.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
