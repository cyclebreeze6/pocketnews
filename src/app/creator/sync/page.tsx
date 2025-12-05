'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { useToast } from '../../../hooks/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import { syncYouTubeChannels } from '../../actions/sync-channels-flow';
import { Alert, AlertTitle, AlertDescription } from '../../../components/ui/alert';

export default function CreatorSyncPage() {
  const [isFetching, setIsFetching] = useState(false);
  const [syncResult, setSyncResult] = useState<{ newVideosAdded: number; syncedChannels: number; errors?: string[] } | null>(null);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsFetching(true);
    setSyncResult(null);

    try {
      const result = await syncYouTubeChannels();
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
          description: `Added ${result.newVideosAdded} new videos from ${result.syncedChannels} channels.`,
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
      setIsFetching(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Automatic Channel Sync</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sync All Channels</CardTitle>
          <CardDescription>
            Fetch the latest videos from all of your linked YouTube channels and automatically add them to your content library.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start gap-4">
            <Button onClick={handleSync} disabled={isFetching} size="lg">
              {isFetching ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Start Sync
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {syncResult && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Sync Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>Successfully synced <span className="font-bold">{syncResult.syncedChannels}</span> channels.</p>
              <p>Added a total of <span className="font-bold">{syncResult.newVideosAdded}</span> new videos.</p>
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
