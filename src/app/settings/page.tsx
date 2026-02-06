
'use client';

import SiteHeader from '../../components/site-header';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { Switch } from '../../components/ui/switch';
import { useUser } from '../../firebase';
import Link from 'next/link';
import { ListFilter } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useUser();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
       <main className="flex-1 py-12 md:py-16">
        <div className="container px-4 md:px-6 max-w-2xl mx-auto">
             <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">
                Settings
            </h1>

            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Privacy</CardTitle>
                    <CardDescription>Control your privacy settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="flex items-start gap-3">
                        <Checkbox id="show-history" defaultChecked />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="show-history">Keep my watch history</Label>
                             <p className="text-sm text-muted-foreground">When this is on, we'll use your watch history to personalize your recommendations.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
             <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>Manage your account settings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive">Delete Account</Button>
                    <p className="text-xs text-muted-foreground mt-2">Permanently delete your account and all of your data. This action cannot be undone.</p>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
