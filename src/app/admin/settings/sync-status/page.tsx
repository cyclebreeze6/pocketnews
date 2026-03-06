
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../../../../components/ui/alert';
import { Monitor, RefreshCw, Zap, CheckCircle2, Clock, PlayCircle, Loader2 } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '../../../../firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Channel } from '../../../../lib/types';
import { Badge } from '../../../../components/ui/badge';
import Link from 'next/link';
import { Button } from '../../../../components/ui/button';
import { syncYouTubeChannels } from '../../../actions/sync-channels-flow';
import { useToast } from '../../../../hooks/use-toast';

export default function AdminSyncStatusPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isTriggering, setIsTriggering] = useState(false);
  
  const activeSyncQuery = useMemoFirebase(() => 
    query(collection(firestore, 'channels'), where('isAutoSyncEnabled', '==', true)), 
    [firestore]
  );
  const { data: activeChannels, isLoading } = useCollection<Channel>(activeSyncQuery);

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Content Sync Status</h1>
        <Button 
          variant="default" 
          onClick={handleManualTrigger} 
          disabled={isTriggering}
          className="bg-primary hover:bg-primary/90"
        >
          {isTriggering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
          Trigger Background Sync Now
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              Scheduler Status
            </CardTitle>
            <CardDescription>
              Current status of the automated background task.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="default" className="border-primary/50 bg-primary/5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertTitle>System Active</AlertTitle>
              <AlertDescription>
                The automated synchronization engine is monitoring your source channels.
              </AlertDescription>
            </Alert>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Interval</span>
              </div>
              <Badge variant="secondary">Every 1 Hour</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Sync Statistics
            </CardTitle>
            <CardDescription>
              Overview of your auto-posting configuration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{activeChannels?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Active Channels</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">24/7</p>
                <p className="text-xs text-muted-foreground">Monitoring</p>
              </div>
            </div>
            <Link href="/admin/auto-post">
              <Button className="w-full" variant="outline">Manage Auto-Post List</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Source Channels</CardTitle>
          <CardDescription>Channels currently receiving automatic updates.</CardDescription>
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
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Active</Badge>
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
