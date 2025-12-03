'use client';

import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { useCollection, useFirebase, useMemoFirebase } from '../../firebase';
import type { User, Video, Channel } from '../../lib/types';
import { collection } from 'firebase/firestore';

export default function AdminDashboard() {
  const { firestore } = useFirebase();

  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const videosQuery = useMemoFirebase(() => collection(firestore, 'videos'), [firestore]);
  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);

  const { data: users } = useCollection<User>(usersQuery);
  const { data: videos } = useCollection<Video>(videosQuery);
  const { data: channels } = useCollection<Channel>(channelsQuery);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{videos?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channels?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
