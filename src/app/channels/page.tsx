'use client';

import SiteHeader from '@/components/site-header';
import { channels } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function AllChannelsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">
            All Channels
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {channels.map((channel) => (
              <Link href={`/channels/${channel.id}`} key={channel.id} className="group">
                <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full">
                    <div className="flex flex-col items-center justify-center p-6 text-center h-full">
                        <Avatar className="w-20 h-20 mb-4">
                        <AvatarImage src={`https://picsum.photos/seed/${channel.id}/100/100`} alt={channel.name} />
                        <AvatarFallback>{channel.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-lg group-hover:text-primary">{channel.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{channel.description}</p>
                    </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
