
'use client';

import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { useCollection, useFirebase, useMemoFirebase, deleteDocumentNonBlocking } from '../../../firebase';
import type { Short, Channel } from '../../../lib/types';
import { collection, Timestamp, doc } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

function toDate(timestamp: Timestamp | Date | string): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
}

export default function CreatorShortsPage() {
  const { firestore } = useFirebase();
  const router = useRouter();

  const shortsQuery = useMemoFirebase(() => collection(firestore, 'shorts'), [firestore]);
  const { data: shorts } = useCollection<Short>(shortsQuery);
  
  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const { data: channels } = useCollection<Channel>(channelsQuery);
  
  const handleDelete = (shortId: string) => {
    if (confirm('Are you sure you want to delete this short?')) {
      const shortRef = doc(firestore, 'shorts', shortId);
      deleteDocumentNonBlocking(shortRef);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Manage Shorts</h1>
        <Button onClick={() => router.push('/creator/shorts/new')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Short
        </Button>
      </div>

      <Card>
        <CardContent className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead className="hidden md:table-cell">Created at</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shorts?.map(short => (
                <TableRow key={short.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={short.title}
                      className="aspect-[9/16] rounded-md object-cover"
                      height="128"
                      src={short.thumbnailUrl}
                      width="72"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{short.title}</TableCell>
                  <TableCell>{channels?.find(c => c.id === short.channelId)?.name || short.channelId}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {toDate(short.createdAt).toLocaleDateString()}
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
                        <DropdownMenuItem onClick={() => router.push(`/creator/shorts/${short.id}`)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(short.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
