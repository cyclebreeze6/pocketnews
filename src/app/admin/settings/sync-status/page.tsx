'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../../../../components/ui/alert';
import { Monitor, RefreshCw, Zap, CheckCircle2, Clock, PlayCircle, Loader2, Database, AlertCircle, RotateCcw } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, useDoc } from '../../../../firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Channel } from '../../../../lib/types';
import { Badge } from '../../../../components/ui/badge';
import Link from 'next/link';
import { Button } from '../../../../components/ui/button';
import { syncYouTubeChannels, triggerSyncReset } from '../../../actions/sync-channels-flow';
import { useToast } from '../../../../hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export default function AdminSyncStatusPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isTriggering, setIsTriggering] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const activeSyncQuery = useMemoFirebase(() => 
    query(collection(firestore, 'channels'), where('isAutoSyncEnabled', '==', true)), 
    [firestore]
  );
  const { data: activeChannels, isLoading } = useCollection<Channel>(activeSyncQuery);

  // Fetch internal sync state
  const syncStateRef = useMemoFirebase(() => doc(firestore, 'metadata', 'sync_state'), [firestore]);
  const { data: syncState } = useDoc(syncStateRef);

  const handleManualTrigger = async () => {
    setIsTriggering(true);
    try {
      const result = await syncYouTubeChannels();
      toast({
        title: 'Background Sync Triggered',
        description: `Added ${result.newVideosAdded} videos from ${result.syncedChannels} channels.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Trigger Failed',
        description: error.message,
      });
    } finally {
      setIsTriggering(false);
    }
  };

  const handleResetCursor = async () => {
    if (!confirm('This will force the sync engine to start over from the beginning of your library. Continue?')) return;
    
    setIsResetting(true);
    try {
        const result = await triggerSyncReset();
        if (result.success) {
            toast({ title: 'Cursor Reset', description: 'The next sync run will start from the beginning.' });
        } else {
            throw new Error(result.error);
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Reset Failed', description: error.message });
    } finally {
        setIsResetting(false);
    }
  };

  const lastSyncDate = syncState?.lastSyncAt ? (syncState.lastSyncAt as any).toDate() : null;
  const statusColor = syncState?.status === 'success' ? 'text-green-500' : (syncState?.status === 'partial_success' ? 'text-yellow-500' : 'text-primary');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Internal Sync Engine</h1>
            <p className="text-muted-foreground">Manage the 24/7 background automation loop.</p>
        </div>
        <div className="flex gap-2">
            <Button 
                variant="outline" 
                onClick={handleResetCursor} 
                disabled={isResetting || !syncState?.lastChannelId}
            >
                {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                Reset Loop
            </Button>
            <Button 
                variant="default" 
                onClick={handleManualTrigger} 
                disabled={isTriggering}
                className="bg-primary hover:bg-primary/90"
            >
                {isTriggering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                Force Run Batch
            </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              Engine Status
            </CardTitle>
            <CardDescription>
              Google Cloud internal scheduler status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="default" className="border-primary/50 bg-primary/5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertTitle>Active & Stateful</AlertTitle>
              <AlertDescription className="text-xs">
                {syncState?.lastMessage || 'Engine is idle and waiting for the next trigger.'}
              </AlertDescription>
            </Alert>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Last Run</span>
              </div>
              <Badge variant="secondary">{lastSyncDate ? `${formatDistanceToNow(lastSyncDate)} ago` : 'Never'}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-yellow-500" />
              State Cursor
            </CardTitle>
            <CardDescription>
              Last processed position in your library.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Cursor Position</p>
                <p className="text-sm font-mono truncate">{syncState?.lastChannelId || 'Loop Beginning'}</p>
            </div>
            <div className="flex items-center justify-between px-1">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className={`text-sm font-bold uppercase ${statusColor}`}>{syncState?.status || 'Unknown'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Batch Stats
            </CardTitle>
            <CardDescription>
              Performance of the last automated run.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{syncState?.lastBatchSize || 0}</p>
                <p className="text-xs text-muted-foreground">Channels</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{syncState?.lastVideosFound || 0}</p>
                <p className="text-xs text-muted-foreground">New Videos</p>
              </div>
            </div>
            <Link href="/admin/auto-post" className="w-full">
              <Button className="w-full" variant="outline">Manage Sources</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {syncState?.lastErrors && syncState.lastErrors.length > 0 && (
        <Card className="border-destructive/20">
            <CardHeader className="bg-destructive/5">
                <CardTitle className="flex items-center gap-2 text-destructive text-lg">
                    <AlertCircle className="h-5 w-5" />
                    Recent Loop Warnings
                </CardTitle>
                <CardDescription>Channels that skipped synchronization due to errors.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <ul className="space-y-2">
                    {syncState.lastErrors.map((err: string, i: number) => (
                        <li key={i} className="text-sm p-2 bg-muted rounded border-l-2 border-destructive">{err}</li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Continuous Loop Queue</CardTitle>
          <CardDescription>Your current position relative to the full automated rotation.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeChannels && activeChannels.length > 0 ? (
            <div className="space-y-2">
              {activeChannels.map(channel => (
                <div key={channel.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={channel.id === syncState?.lastChannelId ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : "bg-primary/10 text-primary border-primary/20"}>
                        {channel.id === syncState?.lastChannelId ? 'Next Batch Start' : 'In Queue'}
                    </Badge>
                    <span className="font-medium text-sm">{channel.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">ID: {channel.id}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No channels are currently enabled for auto-sync.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
