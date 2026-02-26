'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../hooks/use-toast';
import { useFirebase, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '../../../firebase';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import type { Channel } from '../../../lib/types';
import { Loader2, Plus, Zap, Trash2, Globe, Check, X } from 'lucide-react';
import { fetchYouTubeChannelInfo } from '../../actions/youtube-channel-info-flow';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Switch } from '../../../components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';

export default function AdminAutoPostPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [newChannelUrl, setNewChannelUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

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
      // Use AI Flow to get channel details
      const info = await fetchYouTubeChannelInfo({ channelUrl: newChannelUrl });
      
      // Check if channel already exists
      const existingChannel = channels?.find(c => c.youtubeChannelUrl === newChannelUrl);
      
      if (existingChannel) {
        // Just enable auto-sync if it exists
        const channelRef = doc(firestore, 'channels', existingChannel.id);
        updateDocumentNonBlocking(channelRef, { isAutoSyncEnabled: true });
        toast({ title: 'Channel updated', description: `Auto-sync enabled for ${existingChannel.name}.` });
      } else {
        // Create new channel with auto-sync enabled
        const newChannelRef = doc(collection(firestore, 'channels'));
        const channelData: Channel = {
          id: newChannelRef.id,
          name: info.name,
          description: info.description || 'Auto-added for post.',
          logoUrl: info.logoUrl,
          youtubeChannelUrl: newChannelUrl,
          region: info.region || ['Global'],
          createdAt: serverTimestamp(),
          isAutoSyncEnabled: true,
        };
        
        setDocumentNonBlocking(newChannelRef, channelData, {});
        toast({ title: 'Channel added', description: `${info.name} is now set for auto-posting.` });
      }
      
      setNewChannelUrl('');
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error adding channel', description: error.message });
    } finally {
      setIsAdding(false);
    }
  };

  const toggleAutoSync = (channel: Channel) => {
    const channelRef = doc(firestore, 'channels', channel.id);
    updateDocumentNonBlocking(channelRef, { isAutoSyncEnabled: !channel.isAutoSyncEnabled });
    toast({ 
      title: channel.isAutoSyncEnabled ? 'Auto-sync disabled' : 'Auto-sync enabled', 
      description: channel.name 
    });
  };

  const handleRemove = (channelId: string) => {
    if (confirm('Stop auto-posting from this channel? This will not delete existing videos.')) {
      const channelRef = doc(firestore, 'channels', channelId);
      // We don't delete the channel, just clear the URL and sync flag
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
          <p className="text-muted-foreground">Manage channels that automatically post the latest video to your platform every hour.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full border border-primary/20 text-sm font-medium">
            <Zap className="h-4 w-4 animate-pulse" />
            Background Automation Active
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Source Channel</CardTitle>
          <CardDescription>Paste a YouTube Channel URL to enable automatic posting of its latest video.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddChannel} className="flex gap-2">
            <Input 
              placeholder="https://www.youtube.com/@ChannelName" 
              value={newChannelUrl}
              onChange={(e) => setNewChannelUrl(e.target.value)}
              disabled={isAdding}
              className="flex-grow"
            />
            <Button type="submit" disabled={isAdding || !newChannelUrl}>
              {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add Channel
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monitored Channels</CardTitle>
          <CardDescription>These channels are checked every hour. Only the single most recent video is imported if it's new.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Regions</TableHead>
                <TableHead>Auto-Sync</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channelsLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : channels && channels.length > 0 ? (
                channels.map((channel) => (
                  <TableRow key={channel.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={channel.logoUrl} />
                          <AvatarFallback>{channel.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{channel.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{channel.youtubeChannelUrl}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {channel.region?.map(r => (
                          <Badge key={r} variant="outline" className="text-[10px] px-1 py-0">{r}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={!!channel.isAutoSyncEnabled} 
                        onCheckedChange={() => toggleAutoSync(channel)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleRemove(channel.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No source channels added yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
