'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../hooks/use-toast';
import { useFirebase, useCollection, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking } from '../../../firebase';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import type { Channel, Short } from '../../../lib/types';
import { Loader2, Plus, Zap, Trash2, CheckCircle2, RefreshCw, Clapperboard } from 'lucide-react';
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

  // Fetch channels that have a YouTube URL
  const autoSyncQuery = useMemoFirebase(() => 
    query(collection(firestore, 'channels'), where('youtubeChannelUrl', '!=', null)), 
    [firestore]
  );
  const { data: channels, isLoading: channelsLoading } = useCollection<Channel>(autoSyncQuery);

  // Fetch total shorts count for visibility
  const shortsQuery = useMemoFirebase(() => collection(firestore, 'shorts'), [firestore]);
  const { data: shorts } = useCollection<Short>(shortsQuery);

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
          createdAt: serverTimestamp(),
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">AI Auto-Post</h1>
          <p className="text-muted-foreground">Manage channels that feed your news tickers and shorts feed.</p>
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
