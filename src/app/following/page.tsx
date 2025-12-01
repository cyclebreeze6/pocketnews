import SiteHeader from '@/components/site-header';
import { channels } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function FollowingPage() {
  const followedChannels = channels.slice(0, 3); // Mock data

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">
            Channels I Follow
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {followedChannels.length > 0 ? (
              followedChannels.map((channel) => (
                <Card key={channel.id}>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <Avatar className="w-20 h-20 mb-4">
                            <AvatarImage src={`https://picsum.photos/seed/${channel.id}/100/100`} alt={channel.name} />
                            <AvatarFallback>{channel.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-lg font-headline">{channel.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1 mb-4 line-clamp-2">{channel.description}</p>
                        <Button asChild className="w-full">
                            <Link href={`/channels/${channel.id}`}>Visit Channel</Link>
                        </Button>
                    </CardContent>
                </Card>
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground">You are not following any channels yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
