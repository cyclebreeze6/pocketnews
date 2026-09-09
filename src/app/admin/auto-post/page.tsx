'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../hooks/use-toast';
import { useFirebase, useCollection, useDoc, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking } from '../../../firebase';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import type { Channel, Short } from '../../../lib/types';
import { Loader2, Plus, Zap, Trash2, CheckCircle2, RefreshCw, Clapperboard, Clock, Play } from 'lucide-react';
import { fetchYouTubeChannelInfo } from '../../actions/youtube-channel-info-flow';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Switch } from '../../../components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { syncAllChannelsAction } from '../../actions/bulk-auto-import-actions';
import { syncShortsAction } from '../../actions/sync-shorts-action';

export default function AdminAutoPostPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [newChannelUrl, setNewChannelUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingShorts, setIsSyncingShorts] = useState(false);
  const [isAutoImportRunning, setIsAutoImportRunning] = useState(false);
  const [browserAutoRunEnabled, setBrowserAutoRunEnabled] = useState(true);

  // Fetch channels that have a YouTube URL
  const autoSyncQuery = useMemoFirebase(() => 
    query(collection(firestore, 'channels'), where('youtubeChannelUrl', '!=', null)), 
    [firestore]
  );
  const { data: channels, isLoading: channelsLoading } = useCollection<Channel>(autoSyncQuery);

  // Fetch total shorts count for visibility
  const shortsQuery = useMemoFirebase(() => collection(firestore, 'shorts'), [firestore]);
  const { data: shorts } = useCollection<Short>(shortsQuery);

  // Fetch 20-minute auto-import status metadata
  const autoImportMetaRef = useMemoFirebase(() => doc(firestore, 'metadata/auto_import_status'), [firestore]);
  const { data: autoImportMeta } = useDoc<any>(autoImportMetaRef);

  // Automatic 20-minute client timer fallback for active admin session
  useEffect(() => {
    if (!browserAutoRunEnabled) return;

    // Run initial check / set up 20-minute (1,200,000 ms) interval
    const TWENTY_MINUTES_MS = 20 * 60 * 1000;
    const interval = setInterval(async () => {
      console.log('[Auto-Import Ticker] Firing 20-minute client auto-import...');
      try {
        await handleRunAutoImport(true);
      } catch (err: any) {
        console.error('[Auto-Import Ticker] Error:', err.message);
      }
    }, TWENTY_MINUTES_MS);

    return () => clearInterval(interval);
  }, [browserAutoRunEnabled]);

  const handleRunAutoImport = async (silent = false) => {
    setIsAutoImportRunning(true);
    try {
      const response = await fetch('/api/cron/auto-import', { method: 'GET' });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Auto-import request failed');
      }
      if (!silent) {
        toast({
          title: '20-Min Auto-Import Completed',
          description: `Imported ${data.stats?.newVideosImported ?? 0} new videos across ${data.stats?.channelsSynced ?? 0} YouTube channels.`,
        });
      }
    } catch (error: any) {
      if (!silent) {
        toast({ variant: 'destructive', title: 'Auto-Import Error', description: error.message });
      }
    } finally {
      setIsAutoImportRunning(false);
    }
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelUrl) return;

    setIsAdding(true);
    try {
      const info = await fetchYouTubeChannelInfo({ channelUrl: newChannelUrl });
      const existingChannel = channels?.find(c => c.youtubeChannelId === info.youtubeChannelId || c.youtubeChannelUrl === newChannelUrl);
      
      if (existingChannel) {
        const channelRef = doc(firestore, 'channels', existingChannel.id);
        updateDocumentNonBlocking(channelRef, { 
            isAutoSyncEnabled: true,
            youtubeChannelId: info.youtubeChannelId
        });
        toast({ title: 'Channel updated', description: `Auto-sync enabled for ${existingChannel.name}.` });
      } else {
        const newChannelRef = doc(collection(firestore, 'channels'));
        const channelData: Channel = {
          id: newChannelRef.id,
          name: info.name,
          description: info.description || 'Auto-added source.',
          logoUrl: info.logoUrl,
          youtubeChannelUrl: newChannelUrl,
          youtubeChannelId: info.youtubeChannelId,
          region: info.region || ['Global'],
          createdAt: serverTimestamp() as any,
          isAutoSyncEnabled: true,
        };
        
        setDocumentNonBlocking(newChannelRef, channelData, {});
        toast({ title: 'Channel added', description: `${info.name} is now set for auto-posting.` });
      }
      setNewChannelUrl('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error adding channel', description: error.message });
    } finally {
      setIsAdding(false);
    }
  };

  const handleQuickSync = async () => {
    setIsSyncing(true);
    try {
        const result = await syncAllChannelsAction();
        toast({ 
            title: "News Sync Successful", 
            description: `Scanned ${result.synced} channels. Added ${result.count} new videos to Breaking News.` 
        });
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Sync failed", description: error.message });
    } finally {
        setIsSyncing(false);
    }
  };

  const handleSyncShorts = async () => {
    setIsSyncingShorts(true);
    try {
        const result = await syncShortsAction();
        toast({ 
            title: "Shorts Sync Successful", 
            description: `Scanned ${result.synced} channels. Added ${result.count} new items to Shorts.` 
        });
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Shorts sync failed", description: error.message });
    } finally {
        setIsSyncingShorts(false);
    }
  };

  const toggleAutoSync = (channel: Channel) => {
    const channelRef = doc(firestore, 'channels', channel.id);
    updateDocumentNonBlocking(channelRef, { isAutoSyncEnabled: !channel.isAutoSyncEnabled });
  };

  const handleRemove = (channelId: string) => {
    if (confirm('Stop auto-posting from this channel?')) {
      const channelRef = doc(firestore, 'channels', channelId);
      updateDocumentNonBlocking(channelRef, { 
        isAutoSyncEnabled: false,
        youtubeChannelUrl: null 
      });
    }
  };

  const lastImportDate = autoImportMeta?.lastAutoImportAt?.toDate 
    ? autoImportMeta.lastAutoImportAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Pending initial run';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">AI Auto-Post & Auto-Import</h1>
          <p className="text-muted-foreground">Monitors YouTube channels and automatically imports videos every 20 minutes.</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full border border-primary/20 text-sm font-medium">
                <Zap className="h-4 w-4 animate-pulse" />
                Sources: {channels?.filter(c => c.isAutoSyncEnabled).length || 0}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-full border border-border text-sm font-medium">
                <Clapperboard className="h-4 w-4" />
                Shorts: {shorts?.length || 0}
            </div>
        </div>
      </div>

      {/* 20-Minute Auto-Import Status Card */}
      <Card className="border-primary/40 bg-gradient-to-r from-primary/5 via-background to-secondary/10 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <Clock className="h-6 w-6 text-primary animate-spin-slow" />
                20-Minute Auto-Import Engine
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Scans all active YouTube channels automatically every 20 minutes to import fresh videos.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Auto-Import: Active (Every 20m)
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-background/80 border border-border/50 text-sm">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Last Auto-Import</p>
              <p className="text-base font-semibold text-foreground mt-0.5">{lastImportDate}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">New Videos Last Run</p>
              <p className="text-base font-semibold text-foreground mt-0.5">{autoImportMeta?.newVideosImported ?? 0} imported</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Channels Synced</p>
              <p className="text-base font-semibold text-foreground mt-0.5">{autoImportMeta?.syncedChannels ?? 0} active channels</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Switch 
                id="browser-auto-run" 
                checked={browserAutoRunEnabled} 
                onCheckedChange={setBrowserAutoRunEnabled} 
              />
              <label htmlFor="browser-auto-run" className="cursor-pointer font-medium text-foreground">
                In-Browser 20-Min Auto-Runner (Active during admin session)
              </label>
            </div>
            <Button 
              onClick={() => handleRunAutoImport(false)} 
              disabled={isAutoImportRunning} 
              className="w-full sm:w-auto font-medium"
            >
              {isAutoImportRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Auto-Importing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4 fill-current" />
                  Run 20-Min Auto-Import Now
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Sync Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-primary/20 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <RefreshCw className="h-5 w-5 text-primary" />
                    Sync Breaking News
                </CardTitle>
                <CardDescription>Instantly post the latest full-length videos from active channels.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleQuickSync} disabled={isSyncing || !channels?.some(c => c.isAutoSyncEnabled)} className="w-full">
                    {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    {isSyncing ? 'Syncing News...' : 'Sync All News Now'}
                </Button>
            </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Clapperboard className="h-5 w-5 text-primary" />
                    Sync Shorts
                </CardTitle>
                <CardDescription>Instantly post the latest vertical shorts from active channels.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleSyncShorts} disabled={isSyncingShorts || !channels?.some(c => c.isAutoSyncEnabled)} variant="secondary" className="w-full">
                    {isSyncingShorts ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clapperboard className="mr-2 h-4 w-4" />}
                    {isSyncingShorts ? 'Syncing Shorts...' : 'Sync All Shorts Now'}
                </Button>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                <CardTitle>Add Source Channel</CardTitle>
                <CardDescription>Paste a YouTube Channel URL to enable auto-posting.</CardDescription>
                </CardHeader>
                <CardContent>
                <form onSubmit={handleAddChannel} className="space-y-4">
                    <Input 
                    placeholder="https://www.youtube.com/@ChannelName" 
                    value={newChannelUrl}
                    onChange={(e) => setNewChannelUrl(e.target.value)}
                    disabled={isAdding}
                    />
                    <Button type="submit" disabled={isAdding || !newChannelUrl} className="w-full">
                    {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Add Channel
                    </Button>
                </form>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                <CardTitle>Monitored Channels</CardTitle>
                <CardDescription>Toggle auto-sync to allow background updates for each channel.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Channel</TableHead>
                        <TableHead>Auto-Sync</TableHead>
                        <TableHead className="text-right">Remove</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {channelsLoading ? (
                        <TableRow>
                        <TableCell colSpan={3} className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                        </TableRow>
                    ) : channels && channels.length > 0 ? (
                        channels.map((channel) => (
                        <TableRow key={channel.id}>
                            <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 border">
                                <AvatarImage src={channel.logoUrl} />
                                <AvatarFallback>{channel.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                <p className="font-medium text-sm">{channel.name}</p>
                                <div className="flex gap-1 mt-0.5">
                                    {channel.region?.map(r => (
                                        <span key={r} className="text-[9px] uppercase tracking-tighter text-muted-foreground px-1 bg-muted rounded">{r}</span>
                                    ))}
                                </div>
                                </div>
                            </div>
                            </TableCell>
                            <TableCell>
                            <Switch 
                                checked={!!channel.isAutoSyncEnabled} 
                                onCheckedChange={() => toggleAutoSync(channel)}
                            />
                            </TableCell>
                            <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleRemove(channel.id)} className="text-destructive h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                            No sources added yet.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
