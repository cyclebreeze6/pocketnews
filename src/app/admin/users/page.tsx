'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollection, useFirebase, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { collection, doc } from 'firebase/firestore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useState } from 'react';

export default function AdminUsersPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users } = useCollection<UserProfile>(usersQuery);

  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const handleAdminToggle = (user: UserProfile) => {
    const userRef = doc(firestore, 'users', user.id);
    const newAdminStatus = !user.isAdmin;

    setDocumentNonBlocking(userRef, { isAdmin: newAdminStatus }, { merge: true });

    // Additionally, manage the roles_admin collection for DBAC
    const adminRoleRef = doc(firestore, 'roles_admin', user.id);
    if (newAdminStatus) {
      // Use a dummy field because empty documents can be tricky
      setDocumentNonBlocking(adminRoleRef, { isAdmin: true }, {});
    } else {
      deleteDocumentNonBlocking(adminRoleRef);
    }

    toast({
      title: `User role updated`,
      description: `${user.displayName} is now ${newAdminStatus ? 'an admin' : 'not an admin'}.`,
    });
  };

  const handleDeleteUser = () => {
    if (userToDelete) {
      const userRef = doc(firestore, 'users', userToDelete.id);
      deleteDocumentNonBlocking(userRef);
      // Also remove them from the admin roles if they are there
      const adminRoleRef = doc(firestore, 'roles_admin', userToDelete.id);
      deleteDocumentNonBlocking(adminRoleRef);

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
        <CardContent className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Make Admin</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
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
                      <Badge variant={user.isAdmin ? 'default' : 'outline'}>
                        {user.isAdmin ? 'Admin' : 'User'}
                      </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={!!user.isAdmin}
                      onCheckedChange={() => handleAdminToggle(user)}
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
