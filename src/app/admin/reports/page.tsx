
'use client';

import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { useCollection, useFirebase, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '../../../firebase';
import type { Report } from '../../../lib/types';
import { collection, doc, Timestamp, query, orderBy } from 'firebase/firestore';
import { MoreHorizontal, Trash2, CheckCircle, Eye } from 'lucide-react';
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
  const { data: reports, isLoading } = useCollection<Report>(reportsQuery);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Manage Video Reports</h1>
      </div>

      <Card>
        <CardContent className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Video Title</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported At</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading reports...</TableCell>
                  </TableRow>
              )}
              {reports?.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.videoTitle}</TableCell>
                  <TableCell>{report.reason}</TableCell>
                  <TableCell>
                      <Badge variant="outline" className={statusColors[report.status]}>
                          {report.status}
                      </Badge>
                  </TableCell>
                  <TableCell>{toDate(report.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
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
