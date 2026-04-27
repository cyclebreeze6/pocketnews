'use client';

import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { useCollection, useFirebase, useMemoFirebase, deleteDocumentNonBlocking, useUser } from '../../../firebase';
import type { Podcast } from '../../../lib/types';
import { collection, Timestamp, doc, query, where } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal, Trash2, Mic, Radio, Youtube, Video } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

function toDate(timestamp: Timestamp | Date | string): Date {
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  return new Date(timestamp as string);
}

const typeIcons: Record<string, ReactNode> = {
  audio: <Mic className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  facebook: <Radio className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
};

export default function CreatorPodcastsPage() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();

  const podcastsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'podcasts'), where('creatorId', '==', user.uid));
  }, [firestore, user]);
  const { data: podcasts } = useCollection<Podcast>(podcastsQuery);

  const handleDelete = (podcastId: string) => {
    if (confirm('Are you sure you want to delete this podcast?')) {
      const podcastRef = doc(firestore, 'podcasts', podcastId);
      deleteDocumentNonBlocking(podcastRef);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Manage Podcasts</h1>
        <Button onClick={() => router.push('/creator/podcasts/new')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Podcast
        </Button>
      </div>

      <Card>
        <CardContent className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[80px] sm:table-cell">
                  <span className="sr-only">Thumbnail</span>
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {podcasts?.map((podcast) => (
                <TableRow key={podcast.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={podcast.title}
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={podcast.thumbnailUrl}
                      width="64"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{podcast.title}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 capitalize text-sm">
                      {typeIcons[podcast.contentType]}
                      {podcast.contentType}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {toDate(podcast.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/creator/podcasts/${podcast.id}`)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(podcast.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!podcasts?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No podcasts yet. Click "Add Podcast" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
