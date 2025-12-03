'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">Website Settings</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>Upload a new logo for the website.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo-upload">Logo File</Label>
            <Input id="logo-upload" type="file" />
            <p className="text-xs text-muted-foreground">Recommended size: 200x50px, PNG format.</p>
          </div>
          <Button>Upload Logo</Button>
        </CardContent>
      </Card>
    </div>
  );
}
