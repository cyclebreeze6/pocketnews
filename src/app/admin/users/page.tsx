
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { useCollection, useFirebase, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '../../../firebase';
import type { UserProfile } from '../../../lib/types';
import { collection, doc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar';
import { Switch } from '../../../components/ui/switch';
import { useToast } from '../../../hooks/use-toast';
import { Badge } from '../../../components/ui/badge';
import { MoreHorizontal, Trash2, Loader2, UserCheck } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../components/ui/dropdown-menu';
import { Button } from '../../../components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { useState } from 'react';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

export default function AdminUsersPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [promoteEmail, setPromoteEmail] = useState('');
  const [isPromoting, setIsPromoting] = useState(false);

  const handleRoleToggle = (user: UserProfile, role: 'isAdmin' | 'isCreator') => {
    const userRef = doc(firestore, 'users', user.id);
    const newStatus = !user[role];

    if (role === 'isAdmin') {
        const batch = writeBatch(firestore);
        batch.set(userRef, { isAdmin: newStatus }, { merge: true });
        const adminRoleRef = doc(firestore, 'roles_admin', user.id);
        if (newStatus) {
            batch.set(adminRoleRef, { grantedAt: new Date() });
        } else {
            batch.delete(adminRoleRef);
        }
        batch.commit().then(() => {
            toast({
                title: `Admin role updated`,
                description: `${user.displayName} is now ${newStatus ? 'an admin' : 'not an admin'}.`,
            });
        }).catch(err => {
            console.error("Error updating admin status:", err);
            toast({ variant: 'destructive', title: 'Error updating role' });
        });
    } else { // isCreator
        setDocumentNonBlocking(userRef, { isCreator: newStatus }, { merge: true });
        toast({
            title: `Creator role updated`,
            description: `${user.displayName} is now ${newStatus ? 'a creator' : 'not a creator'}.`,
        });
    }
  };


  const handleDeleteUser = () => {
    if (userToDelete) {
      const batch = writeBatch(firestore);
      const userRef = doc(firestore, 'users', userToDelete.id);
      batch.delete(userRef);

      const adminRoleRef = doc(firestore, 'roles_admin', userToDelete.id);
      batch.delete(adminRoleRef);

      batch.commit().then(() => {
        toast({
          title: 'User deleted',
          description: `${userToDelete.displayName} has been removed.`,
        });
        setUserToDelete(null);
      }).catch(err => {
        console.error("Error deleting user:", err);
        toast({ variant: 'destructive', title: 'Error deleting user' });
      });
    }
  };

  const handlePromoteByEmail = async () => {
    if (!promoteEmail) {
      toast({ variant: 'destructive', title: 'Please enter an email address.' });
      return;
    }
    setIsPromoting(true);

    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('email', '==', promoteEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ variant: 'destructive', title: 'User not found', description: `No user with the email ${promoteEmail} exists.` });
        setIsPromoting(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userToPromote = { id: userDoc.id, ...userDoc.data() } as UserProfile;

      if (userToPromote.isAdmin) {
        toast({ title: 'Already an Admin', description: `${userToPromote.displayName} is already an administrator.` });
        setPromoteEmail('');
        setIsPromoting(false);
        return;
      }

      const batch = writeBatch(firestore);
      const userRef = doc(firestore, 'users', userToPromote.id);
      batch.set(userRef, { isAdmin: true }, { merge: true });
      const adminRoleRef = doc(firestore, 'roles_admin', userToPromote.id);
      batch.set(adminRoleRef, { grantedAt: new Date() });

      await batch.commit();

      toast({
        title: 'User Promoted!',
        description: `${userToPromote.displayName} (${userToPromote.email}) is now an administrator.`,
      });
      setPromoteEmail('');

    } catch (error) {
      console.error('Error promoting user:', error);
      toast({ variant: 'destructive', title: 'Error promoting user' });
    } finally {
      setIsPromoting(false);
    }
  };


  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">Manage Users</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Promote New Admin</CardTitle>
          <CardDescription>Grant administrator privileges to an existing user by entering their email address.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="promote-email" className="sr-only">Email</Label>
              <Input
                id="promote-email"
                type="email"
                placeholder="Enter user's email"
                value={promoteEmail}
                onChange={(e) => setPromoteEmail(e.target.value)}
                disabled={isPromoting}
              />
            </div>
            <Button onClick={handlePromoteByEmail} disabled={isPromoting || !promoteEmail}>
              {isPromoting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Promote to Admin
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Make Creator</TableHead>
                <TableHead>Make Admin</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading users...</TableCell>
                </TableRow>
              )}
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                         <AvatarImage src={user.avatar || `https://avatar.vercel.sh/${user.id}.png`} alt={user.displayName} />
                        <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.displayName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                      <div className="flex flex-col gap-1">
                        {user.isAdmin && <Badge variant="default">Admin</Badge>}
                        {user.isCreator && <Badge variant="secondary">Creator</Badge>}
                        {!user.isAdmin && !user.isCreator && <Badge variant="outline">User</Badge>}
                      </div>
                  </TableCell>
                   <TableCell>
                    <Switch
                      checked={!!user.isCreator}
                      onCheckedChange={() => handleRoleToggle(user, 'isCreator')}
                      aria-label={`Toggle creator status for ${user.displayName}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={!!user.isAdmin}
                      onCheckedChange={() => handleRoleToggle(user, 'isAdmin')}
                      aria-label={`Toggle admin status for ${user.displayName}`}
                    />
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={() => setUserToDelete(user)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user
                            account and remove their data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteUser}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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

    