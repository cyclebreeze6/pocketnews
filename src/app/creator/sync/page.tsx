'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { useToast } from '../../../hooks/use-toast';
import { Loader2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { syncYouTubeChannels } from '../../../ai/flows/sync-channels-flow';
import type { SyncResult } from '../../../ai/flows/sync-channels-flow';

export default function CreatorSyncPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncYouTubeChannels();
      setSyncResult(result);
      if (result.errors && result.errors.length > 0) {
        toast({
            variant: 'destructive',
            title: 'Sync Complete with Errors',
            description: `Synced ${result.syncedChannels} channels, added ${result.newVideosAdded} new videos. Some channels failed.`
        });
      } else {
        toast({
            title: 'Sync Complete!',
            description: `Synced ${result.syncedChannels} channels and added ${result.newVideosAdded} new videos.`
        });
      }

    } catch (error: any) {
      console.error('An unexpected error occurred during sync:', error);
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
      setSyncResult({ syncedChannels: 0, newVideosAdded: 0, errors: ['The sync process failed unexpectedly.'] });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">Sync YouTube Channels</h1>
      <Card>
        <CardHeader>
          <CardTitle>One-Click Content Refresh</CardTitle>
          <CardDescription>
            Click the button below to fetch the latest videos from all your channels that have a "YouTube Channel URL" configured. The system will automatically add any new videos it finds.
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
                  Sync New Videos from All Channels
                </>
              )}
            </Button>

            {syncResult && (
              <Card className="w-full bg-card/50 mt-4">
                <CardHeader>
                    <CardTitle>Sync Report</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                         <div className="flex items-center">
                            <CheckCircle className="mr-3 h-5 w-5 text-green-500" />
                            <p>
                                <span className="font-bold">{syncResult.newVideosAdded}</span> new videos were added.
                            </p>
                        </div>
                        <div className="flex items-center">
                            <CheckCircle className="mr-3 h-5 w-5 text-green-500" />
                            <p>
                                <span className="font-bold">{syncResult.syncedChannels}</span> channels were successfully checked.
                            </p>
                        </div>
                        {syncResult.errors && syncResult.errors.length > 0 && (
                             <div className="flex items-start">
                                <XCircle className="mr-3 h-5 w-5 text-destructive mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-destructive">
                                        {syncResult.errors.length} channels failed to sync:
                                    </p>
                                    <ul className="list-disc pl-5 mt-1 text-sm text-destructive">
                                        {syncResult.errors.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
