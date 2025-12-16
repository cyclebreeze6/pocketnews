
'use client';

import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../components/ui/card';
import { useCollection, useFirebase, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '../../../firebase';
import type { Report, Video, Channel } from '../../../lib/types';
import { collection, doc, Timestamp, query, orderBy } from 'firebase/firestore';
import { MoreHorizontal, Trash2, CheckCircle, Eye, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '../../../components/ui/dropdown-menu';
import { Badge } from '../../../components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';

function toDate(timestamp: Timestamp | Date | string): Date {
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    return new Date(timestamp);
}

const statusColors: { [key: string]: string } = {
    Pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
    Reviewed: 'bg-blue-500/20 text-blue-500 border-blue-500/50',
    Resolved: 'bg-green-500/20 text-green-500 border-green-500/50',
    Dismissed: 'bg-gray-500/20 text-gray-500 border-gray-500/50',
};


export default function AdminReportsPage() {
  const { firestore } = useFirebase();

  const reportsQuery = useMemoFirebase(() => query(collection(firestore, 'reports'), orderBy('createdAt', 'desc')), [firestore]);
  const { data: reports, isLoading: reportsLoading } = useCollection<Report>(reportsQuery);

  const videosQuery = useMemoFirebase(() => collection(firestore, 'videos'), [firestore]);
  const { data: videos, isLoading: videosLoading } = useCollection<Video>(videosQuery);
  
  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const { data: channels, isLoading: channelsLoading } = useCollection<Channel>(channelsQuery);


  const handleStatusChange = (reportId: string, status: Report['status']) => {
    const reportRef = doc(firestore, 'reports', reportId);
    updateDocumentNonBlocking(reportRef, { status });
  };
  
  const handleDeleteVideo = (videoId: string) => {
    if(confirm(`Are you sure you want to delete video ID: ${videoId}? This action cannot be undone.`)) {
        const videoRef = doc(firestore, 'videos', videoId);
        deleteDocumentNonBlocking(videoRef);
    }
  }

  const isLoading = reportsLoading || videosLoading || channelsLoading;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Videos Reported</h1>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 space-y-2"><div className="h-32 bg-muted animate-pulse rounded-md" /><div className="h-4 bg-muted animate-pulse rounded-md" /><div className="h-4 w-2/3 bg-muted animate-pulse rounded-md" /></CardContent></Card>
        ))}
        {!isLoading && reports?.map((report) => {
            const video = videos?.find(v => v.id === report.videoId);
            const channel = channels?.find(c => c.id === video?.channelId);
            return (
                 <Card key={report.id} className="flex flex-col">
                    <CardHeader>
                        {video && (
                             <Link href={`/watch/${video.id}`} target="_blank" className="block relative aspect-video mb-2">
                                <Image src={video.thumbnailUrl} alt={video.title} fill className="rounded-md object-cover"/>
                            </Link>
                        )}
                        <CardTitle className="text-base line-clamp-2">{report.videoTitle}</CardTitle>
                        {channel && <CardDescription className="text-xs">From channel: {channel.name}</CardDescription>}
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <div className="space-y-1">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                Report Details
                            </h4>
                            <p className="text-sm"><strong>Reason:</strong> {report.reason}</p>
                            {report.details && <p className="text-sm text-muted-foreground bg-accent p-2 rounded-md">"{report.details}"</p>}
                        </div>
                         <div className="text-xs text-muted-foreground">
                           Reported on {toDate(report.createdAt).toLocaleString()}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center bg-card/50 p-3">
                         <Badge variant="outline" className={statusColors[report.status]}>
                            {report.status}
                        </Badge>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                <Link href={`/watch/${report.videoId}`} target="_blank">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Video
                                </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        <span>Change Status</span>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuItem onClick={() => handleStatusChange(report.id, 'Pending')}>Pending</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(report.id, 'Reviewed')}>Reviewed</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(report.id, 'Resolved')}>Resolved</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(report.id, 'Dismissed')}>Dismissed</DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteVideo(report.videoId)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Video
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardFooter>
                 </Card>
            )
        })}
      </div>
      {!isLoading && reports?.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">No Reports</h2>
            <p className="text-muted-foreground mt-2">There are no pending or resolved video reports.</p>
          </div>
      )}
    </div>
  );
}
