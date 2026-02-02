'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../../../../components/ui/alert';
import { MonitorOff } from 'lucide-react';

export default function AdminSyncStatusPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">Content Sync Status</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Auto-Sync Disabled</CardTitle>
          <CardDescription>
            The automated content synchronization feature has been disabled to ensure platform stability.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="default">
            <MonitorOff className="h-4 w-4" />
            <AlertTitle>Feature Disabled</AlertTitle>
            <AlertDescription>
              The "Breaking News" auto-sync feature is currently turned off.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
