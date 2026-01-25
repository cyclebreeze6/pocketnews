
'use client';

import { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { useToast } from '../../../../hooks/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import { runAutoSyncBreakingNews } from '../../../actions/auto-sync-breaking-news';
import type { AutoSyncResult } from '../../../../ai/flows/auto-sync-breaking-news-flow';
import { Alert, AlertTitle, AlertDescription } from '../../../../components/ui/alert';

export default function AdminSyncStatusPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<AutoSyncResult | null>(null);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const result = await runAutoSyncBreakingNews();
      setSyncResult(result);

      if (result.errors && result.errors.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Sync Complete with Errors',
          description: `Synced ${result.syncedChannels} channels, but some failed.`,
        });
      } else {
        toast({
          title: 'Sync Complete!',
          description: `Added ${result.newVideosAdded} new "Breaking News" videos from ${result.syncedChannels} channels.`,
        });
      }

    } catch (error: any) {
      console.error('An unexpected error occurred during sync:', error);
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">Content Sync Status</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Breaking News Auto-Sync</CardTitle>
          <CardDescription>
            This process is scheduled to run automatically every 30 minutes. You can also trigger it manually here to check its status and fetch the latest breaking news immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start gap-4">
            <Button onClick={handleSync} disabled={isSyncing} size="lg">
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Run "Breaking News" Sync
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {syncResult && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Last Sync Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>Successfully processed <span className="font-bold">{syncResult.syncedChannels}</span> channels.</p>
              <p>Added a total of <span className="font-bold">{syncResult.newVideosAdded}</span> new "Breaking News" videos.</p>
              {syncResult.errors && syncResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTitle>Errors Encountered</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1">
                      {syncResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
