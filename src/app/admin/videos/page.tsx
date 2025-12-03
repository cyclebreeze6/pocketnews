'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollection, useFirebase, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import type { Video } from '@/lib/types';
import { collection } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { doc } from 'firebase/firestore';

export default function AdminVideosPage() {
    const { firestore } = useFirebase();
    const videosQuery = useMemoFirebase(() => collection(firestore, 'videos'), [firestore]);
    const { data: videos } = useCollection<Video>(videosQuery);

    const handleDelete = (videoId: string) => {
        if (confirm('Are you sure you want to delete this video?')) {
            const videoRef = doc(firestore, 'videos', videoId);
            deleteDocumentNonBlocking(videoRef);
        }
    };

  return (
    <div>
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Manage Videos</h1>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Video
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
                        {videos?.map(video => (
                             <TableRow key={video.id}>
                                <TableCell className="hidden sm:table-cell">
                                    <Image
                                        alt={video.title}
                                        className="aspect-square rounded-md object-cover"
                                        height="64"
                                        src={video.thumbnailUrl}
                                        width="64"
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{video.title}</TableCell>
                                <TableCell>{video.channelId}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {new Date(video.createdAt as string).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button
                                            aria-haspopup="true"
                                            size="icon"
                                            variant="ghost"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>Edit</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(video.id)} className="text-destructive">
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
