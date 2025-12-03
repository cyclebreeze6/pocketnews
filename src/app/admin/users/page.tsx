'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollection, useFirebase, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { collection, doc } from 'firebase/firestore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function AdminUsersPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users } = useCollection<UserProfile>(usersQuery);

  const handleAdminToggle = (user: UserProfile) => {
    const userRef = doc(firestore, 'users', user.id);
    const newAdminStatus = !user.isAdmin;
    setDocumentNonBlocking(userRef, { isAdmin: newAdminStatus }, { merge: true });
    toast({
      title: `User role updated`,
      description: `${user.displayName} is now ${newAdminStatus ? 'an admin' : 'not an admin'}.`,
    });
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
                <TableHead>Admin</TableHead>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
