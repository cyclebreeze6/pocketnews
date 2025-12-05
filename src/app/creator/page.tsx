'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import Link from 'next/link';
import { Video, Tv, RefreshCw, PlusSquare } from 'lucide-react';

export default function CreatorDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">Creator Hub</h1>
      <p className="mb-8 text-muted-foreground">
        Manage your content from one central place. Upload new videos, organize channels, and sync content from YouTube.
      </p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PlusSquare className="h-5 w-5" /> Add Videos</CardTitle>
            <CardDescription>Add new videos one by one from a YouTube link.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/creator/videos/new">
              <Button>Add a Video</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Video className="h-5 w-5" /> Manage Videos</CardTitle>
            <CardDescription>View, edit, and manage your entire video library.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/creator/videos">
              <Button variant="secondary">Manage Library</Button>
            </Link>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5" /> Sync Content</CardTitle>
            <CardDescription>Fetch the latest videos from all linked channels.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/creator/sync">
              <Button>Sync All Channels</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
