'use client';

import SiteHeader from '@/components/site-header';
import { channels } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function AllChannelsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">
            All Channels
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {channels.map((channel) => (
              <Link href={`/channels/${channel.id}`} key={channel.id} className="group">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-card/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={`https://picsum.photos/seed/${channel.id}/100/100`} alt={channel.name} />
                      <AvatarFallback>{channel.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold group-hover:text-primary">{channel.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{channel.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
