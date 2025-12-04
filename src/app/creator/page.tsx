'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import Link from 'next/link';
import { Video, Tv, Download } from 'lucide-react';

export default function CreatorDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">Creator Hub</h1>
      <p className="mb-8 text-muted-foreground">
        Manage your content from one central place. Upload new videos, organize channels, and import content from YouTube.
      </p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Video className="h-5 w-5" /> Videos</CardTitle>
            <CardDescription>Add, edit, and manage your video library.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/creator/videos">
              <Button>Manage Videos</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Tv className="h-5 w-5" /> Channels</CardTitle>
            <CardDescription>Create and organize your channels.</CardDescription>
          </CardHeader>
          <CardContent>
             <Link href="/creator/channels">
              <Button>Manage Channels</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" /> Import</CardTitle>
            <CardDescription>Fetch and import videos from YouTube.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/creator/import">
              <Button>Import Videos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
