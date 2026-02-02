'use client';

import { Button } from '../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../../components/ui/card';
import Link from 'next/link';
import { BellRing, KeyRound, Image as ImageIcon } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">Website Settings</h1>
      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Website Branding</CardTitle>
            <CardDescription>Manage your website's visual identity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center gap-4 p-4 border rounded-lg">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <div className="flex-grow">
                    <h3 className="font-semibold">Logo</h3>
                    <p className="text-sm text-muted-foreground">Upload a new logo for the website.</p>
                </div>
                 <Button>Upload Logo</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Integrations &amp; Services</CardTitle>
            <CardDescription>Configure third-party services like push notifications and data APIs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Link href="/admin/settings/api-keys" className="block">
                <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors">
                    <KeyRound className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-grow">
                        <h3 className="font-semibold">API Keys</h3>
                        <p className="text-sm text-muted-foreground">Manage your YouTube Data API key.</p>
                    </div>
                    <Button variant="secondary">Configure</Button>
                </div>
            </Link>
            <Link href="/admin/settings/notifications" className="block">
                <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors">
                    <BellRing className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-grow">
                        <h3 className="font-semibold">Push Notifications</h3>
                        <p className="text-sm text-muted-foreground">Configure your Firebase credentials to send notifications.</p>
                    </div>
                    <Button variant="secondary">Configure</Button>
                </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
