'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../hooks/use-toast';
import { useFirebase, useCollection, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking } from '../../../firebase';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import type { Channel } from '../../../lib/types';
import { Loader2, Plus, Zap, Trash2, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, Video } from 'lucide-react';
import { fetchYouTubeChannelInfo } from '../../actions/youtube-channel-info-flow';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Switch } from '../../../components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { discoverLatestVideos, commitBulkImport, type DiscoveredVideo } from '../../actions/bulk-auto-import-actions';
import Image from 'next/image';

export default function AdminAutoPostPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [newChannelUrl, setNewChannelUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Discovery Wizard State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [discoveredVideos, setDiscoveredVideos] = useState<DiscoveredVideo[]>([]);

  // Fetch channels that have a YouTube URL
  const autoSyncQuery = useMemoFirebase(() => 
    query(collection(firestore, 'channels'), where('youtubeChannelUrl', '!=', null)), 
    [firestore]
  );
  const { data: channels, isLoading: channelsLoading } = useCollection<Channel>(autoSyncQuery);

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

  const handleStartDiscovery = async () => {
    setIsDiscovering(true);
    try {
        const discovered = await discoverLatestVideos();
        setDiscoveredVideos(discovered);
        setStep(2);
        if (discovered.length === 0) {
            toast({ title: "No new content", description: "All monitored channels are up to date." });
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Discovery failed", description: error.message });
    } finally {
        setIsDiscovering(false);
    }
  };

  const handleBulkImport = async () => {
    setIsImporting(true);
    try {
        const result = await commitBulkImport(discoveredVideos);
        toast({ title: "Import Successful", description: `Added ${result.count} new videos to Breaking News.` });
        setStep(3);
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Import failed", description: error.message });
    } finally {
        setIsImporting(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setDiscoveredVideos([]);
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
          <p className="text-muted-foreground">Manage channels that feed your 24/7 breaking news ticker.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full border border-primary/20 text-sm font-medium">
            <Zap className="h-4 w-4 animate-pulse" />
            Active Sources: {channels?.filter(c => c.isAutoSyncEnabled).length || 0}
        </div>
      </div>

      {/* Auto Import Wizard */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-primary" />
                    Bulk Auto-Import Wizard
                </CardTitle>
                <CardDescription>A 3-step manual trigger to refresh all news sources instantly.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                {[1, 2, 3].map((s) => (
                    <div 
                        key={s} 
                        className={`h-2 w-8 rounded-full transition-colors ${s === step ? 'bg-primary' : s < step ? 'bg-primary/40' : 'bg-muted'}`} 
                    />
                ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="py-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Video className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">Check for Fresh News</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">This will scan all enabled channels for their latest upload. No duplicates will be imported.</p>
                </div>
                <Button onClick={handleStartDiscovery} disabled={isDiscovering || !channels?.some(c => c.isAutoSyncEnabled)} size="lg">
                    {isDiscovering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Check for New Content
                </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        Discovered {discoveredVideos.length} New Videos
                    </h3>
                    <Button variant="ghost" size="sm" onClick={resetWizard}>Cancel</Button>
                </div>
                {discoveredVideos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-1">
                        {discoveredVideos.map((video) => (
                            <div key={video.youtubeVideoId} className="flex gap-3 p-2 rounded-lg border bg-card">
                                <div className="relative w-24 h-14 flex-shrink-0">
                                    <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover rounded" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold line-clamp-2 leading-tight">{video.title}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1 truncate">{video.channelName}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center border-2 border-dashed rounded-lg">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No new videos found since last sync.</p>
                    </div>
                )}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={resetWizard}>Back</Button>
                    <Button onClick={handleBulkImport} disabled={isImporting || discoveredVideos.length === 0}>
                        {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                        Import All to Breaking News
                    </Button>
                </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-8 text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <div>
                    <h3 className="text-xl font-bold">Import Complete!</h3>
                    <p className="text-sm text-muted-foreground">Your feed is now updated and notifications have been sent to followers.</p>
                </div>
                <Button variant="outline" onClick={resetWizard}>Done</Button>
            </div>
          )}
        </CardContent>
      </Card>

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
