'use client';

import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Button } from '../../../../components/ui/button';
import { useCollection, useFirebase, useMemoFirebase, updateDocumentNonBlocking } from '../../../../firebase';
import type { CreatorApplication, User } from '../../../../lib/types';
import { collection, doc, query, where, Timestamp } from 'firebase/firestore';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../../../../hooks/use-toast';

export default function AdminCreatorApplicationsPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const applicationsQuery = useMemoFirebase(
    () => collection(firestore, 'creator_applications'),
    [firestore]
  );
  const { data: applications, isLoading } = useCollection<CreatorApplication>(applicationsQuery);

  const handleApprove = async (app: CreatorApplication) => {
    if (!confirm(`Are you sure you want to approve ${app.email} as a Creator?`)) return;

    try {
      // 1. Update application status
      const appRef = doc(firestore, 'creator_applications', app.id);
      updateDocumentNonBlocking(appRef, { status: 'approved' });

      // 2. Set isCreator = true for the user and initialize totalPaidOutNaira
      const userRef = doc(firestore, 'users', app.userId);
      updateDocumentNonBlocking(userRef, { 
        isCreator: true,
        totalPaidOutNaira: 0 
      });

      toast({ title: 'Creator Approved!', description: `${app.email} is now a creator.` });
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleReject = async (appId: string) => {
    if (!confirm('Are you sure you want to reject this application?')) return;
    
    try {
      const appRef = doc(firestore, 'creator_applications', appId);
      updateDocumentNonBlocking(appRef, { status: 'rejected' });
      toast({ title: 'Application Rejected' });
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // Sort applications so pending appears first
  const sortedApps = applications?.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return 0;
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">Creator Applications</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email / User</TableHead>
                <TableHead>NIN</TableHead>
                <TableHead>Content Types</TableHead>
                <TableHead>Date Applied</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedApps?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No creator applications found.
                  </TableCell>
                </TableRow>
              )}
              {sortedApps?.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.email}</TableCell>
                  <TableCell>{app.ninNumber}</TableCell>
                  <TableCell>{app.contentTypes?.join(', ') || 'N/A'}</TableCell>
                  <TableCell>
                      {app.createdAt && (app.createdAt instanceof Timestamp ? app.createdAt.toDate().toLocaleDateString() : new Date(app.createdAt as string).toLocaleDateString())}
                  </TableCell>
                  <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          app.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          app.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'
                      }`}>
                          {app.status.toUpperCase()}
                      </span>
                  </TableCell>
                  <TableCell>
                    {app.status === 'pending' && (
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200" onClick={() => handleApprove(app)}>
                                <CheckCircle className="mr-1 h-3 w-3" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200" onClick={() => handleReject(app.id)}>
                                <XCircle className="mr-1 h-3 w-3" /> Reject
                            </Button>
                        </div>
                    )}
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
