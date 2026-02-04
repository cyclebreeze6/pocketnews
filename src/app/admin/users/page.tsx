'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { useCollection, useFirebase, useMemoFirebase, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '../../../firebase';
import type { UserProfile } from '../../../lib/types';
import { collection, doc } from 'firebase/firestore';
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar';
import { Switch } from '../../../components/ui/switch';
import { useToast } from '../../../hooks/use-toast';
import { Badge } from '../../../components/ui/badge';
import { MoreHorizontal, Trash2, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../components/ui/dropdown-menu';
import { Button } from '../../../components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { useState } from 'react';

export default function AdminUsersPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const handleRoleToggle = (user: UserProfile, role: 'isAdmin' | 'isCreator') => {
    const userRef = doc(firestore, 'users', user.id);
    const newStatus = !user[role];

    updateDocumentNonBlocking(userRef, { [role]: newStatus });

    toast({
        title: `${role === 'isAdmin' ? 'Admin' : 'Creator'} role updated`,
        description: `${user.displayName} is now ${newStatus ? `an ${role === 'isAdmin' ? 'admin' : 'a creator'}` : `not an ${role === 'isAdmin' ? 'admin' : 'a creator'}`}.`,
    });
  };

  const handleDeleteUser = () => {
    if (userToDelete) {
      const userRef = doc(firestore, 'users', userToDelete.id);
      deleteDocumentNonBlocking(userRef);
      toast({
        title: 'User deleted',
        description: `${userToDelete.displayName} has been removed.`,
      });
      setUserToDelete(null);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">Manage Users</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Manage roles and permissions for all users in the system.</CardDescription>
        </CardHeader>
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
                  <TableCell colSpan={6} className="text-center">
                    <div className="flex justify-center items-center p-4">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Loading users...</span>
                    </div>
                  </TableCell>
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
