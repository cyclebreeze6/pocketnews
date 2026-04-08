'use client';

import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { useCollection, useFirebase, useMemoFirebase, deleteDocumentNonBlocking, uploadFile, useStorage, useUser } from '../../../firebase';
import type { Channel } from '../../../lib/types';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal, Trash2, Loader2, X, Tv, RefreshCw, UploadCloud, Smartphone } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '../../../components/ui/dropdown-menu';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useState, useMemo } from 'react';
import { useToast } from '../../../hooks/use-toast';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Textarea } from '../../../components/ui/textarea';
import { fetchChannelShortsAction } from '../../actions/youtube-channel-shorts-flow';
import { saveImportedShorts } from '../../actions/bulk-import-shorts-actions';
import { fetchYouTubeChannelInfo } from '../../actions/youtube-channel-info-flow';
import type { YouTubeShortDetails } from '../../../ai/flows/youtube-channel-shorts-flow';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { REGIONS } from '../../../lib/constants';
import { Badge } from '../../../components/ui/badge';

export default function AdminShortsChannelsPage() {
  const { firestore } = useFirebase();
  const storage = useStorage();
  const { toast } = useToast();
  const { user } = useUser();

  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const { data: channels } = useCollection<Channel>(channelsQuery);

  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [youtubeChannelUrl, setYoutubeChannelUrl] = useState('');
  const [youtubeChannelId, setYoutubeChannelId] = useState('');
  const [channelRegions, setChannelRegions] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);

  const [regionFilter, setRegionFilter] = useState('');
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingChannelId, setSyncingChannelId] = useState<string | null>(null);
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [videosToImport, setVideosToImport] = useState<YouTubeShortDetails[]>([]);
  const [importingVideoId, setImportingVideoId] = useState<string | null>(null);

  const handleFetchChannelInfo = async () => {
    if (!youtubeChannelUrl) {
      toast({ variant: 'destructive', title: 'Please enter a YouTube Channel URL.' });
      return;
    }
    setIsFetchingInfo(true);
    try {
      const info = await fetchYouTubeChannelInfo({ channelUrl: youtubeChannelUrl });
      setChannelName(info.name);
      setChannelDescription(info.description || '');
      setChannelRegions(info.region || []);
      setLogoPreview(info.logoUrl);
      setYoutubeChannelId(info.youtubeChannelId);
      setLogoFile(null); // Clear file if we fetched a new logo URL
      toast({ title: "Channel info populated! ID and regions have been set automatically." });
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Failed to fetch info', description: error.message });
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setChannelName('');
    setChannelDescription('');
    setYoutubeChannelUrl('');
    setYoutubeChannelId('');
    setChannelRegions([]);
    setLogoFile(null);
    setLogoPreview(null);
    setEditingChannel(null);
  };

  const handleSetEditing = (channel: Channel | null) => {
    if (channel) {
      setEditingChannel(channel);
      setChannelName(channel.name);
      setChannelDescription(channel.description);
      setYoutubeChannelUrl(channel.youtubeChannelUrl || '');
      setYoutubeChannelId(channel.youtubeChannelId || '');
      setChannelRegions(Array.isArray(channel.region) ? channel.region : (channel.region ? [channel.region] : []));
      setLogoPreview(channel.logoUrl || null);
      setLogoFile(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      resetForm();
    }
  };

  const handleSaveChanges = async () => {
    if (!channelName || !channelDescription) {
      toast({ variant: 'destructive', title: 'Please fill out name and description.' });
      return;
    }

    setIsSaving(true);
    
    try {
        let finalLogoUrl = editingChannel?.logoUrl || '';

        if (logoFile) {
            const filePath = `channel-logos/${Date.now()}_${logoFile.name}`;
            finalLogoUrl = await uploadFile(storage, logoFile, filePath);
        } else if (logoPreview && !logoFile && (!editingChannel || editingChannel.logoUrl !== logoPreview)) {
            finalLogoUrl = logoPreview;
        }

        const channelData = {
          name: channelName,
          description: channelDescription,
          youtubeChannelUrl: youtubeChannelUrl.trim(),
          youtubeChannelId: youtubeChannelId.trim(),
          logoUrl: finalLogoUrl,
          region: channelRegions.length > 0 ? channelRegions : ['Global'],
        };

        if (editingChannel) {
            const channelRef = doc(firestore, 'channels', editingChannel.id);
            await setDoc(channelRef, channelData, { merge: true });
            toast({ title: 'Channel updated!' });
        } else {
            const channelsCollection = collection(firestore, 'channels');
            const newDocRef = doc(channelsCollection);
            const newChannelData = {
                id: newDocRef.id,
                ...channelData,
                createdAt: serverTimestamp(),
            };
            await setDoc(newDocRef, newChannelData);
            toast({ title: 'Channel created!' });
        }

        resetForm();
    } catch (error) {
        console.error("Failed to save channel:", error);
        toast({ variant: 'destructive', title: 'Save failed', description: 'Could not save channel data.' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = (channelId: string) => {
    if (confirm('Are you sure you want to delete this channel? This will not delete the videos in it.')) {
      const channelRef = doc(firestore, 'channels', channelId);
      deleteDocumentNonBlocking(channelRef);
    }
  };

  const handleOpenSyncDialog = async (channel: Channel) => {
    if (!channel.youtubeChannelUrl) {
        toast({ variant: 'destructive', title: 'No YouTube URL', description: 'This channel does not have a YouTube URL linked.' });
        return;
    }

    setSyncingChannelId(channel.id);
    setIsSyncing(true);
    setVideosToImport([]);
    setIsSyncDialogOpen(true);

    try {
        const shorts = await fetchChannelShortsAction({ 
            channelUrl: channel.youtubeChannelUrl,
            maxResults: 15
        });
        setVideosToImport(shorts);
        if (shorts.length === 0) {
            toast({ title: 'No recent shorts found.' });
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to fetch shorts', description: error.message || 'Could not fetch shorts for this channel.' });
        setIsSyncDialogOpen(false); 
    } finally {
        setIsSyncing(false);
    }
  };

  const handleImportVideo = async (video: YouTubeShortDetails) => {
    if (!syncingChannelId || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Missing channel ID or user session.' });
        return;
    }

    setImportingVideoId(video.youtubeVideoId);
    
    try {
        await saveImportedShorts([{
            youtubeVideoId: video.youtubeVideoId,
            title: video.title,
            thumbnailUrl: video.thumbnailUrl,
            channelId: syncingChannelId,
            creatorId: user.uid
        }]);
        
        toast({ title: 'Short imported successfully!' });
        
        // Remove the imported video from the list
        setVideosToImport(prev => prev.filter(v => v.youtubeVideoId !== video.youtubeVideoId));
        
        if (videosToImport.length <= 1) {
            setIsSyncDialogOpen(false);
        }
    } catch (error: any) {
        console.error('Failed to import short', error);
        toast({ variant: 'destructive', title: 'Import failed', description: error.message || 'Failed to import the short.' });
    } finally {
        setImportingVideoId(null);
    }
  };

  const filteredChannels = useMemo(() => {
    if (!channels) return [];
    return channels.filter(channel => {
      const regionMatch = !regionFilter || (Array.isArray(channel.region) ? channel.region.includes(regionFilter) : channel.region === regionFilter);
      return regionMatch;
    });
  }, [channels, regionFilter]);


  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Manage Shorts Channels</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingChannel ? 'Edit Channel' : 'Add New Channel'}</CardTitle>
          <CardDescription>
            {editingChannel ? `Editing the channel "${editingChannel.name}"` : 'Fill out the form below to add a new channel for Shorts.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 grid gap-4">
               <div className="grid gap-2">
                 <Label htmlFor="youtube-url">YouTube Channel URL</Label>
                 <div className="flex gap-2">
                    <Input 
                        id="youtube-url" 
                        placeholder="https://www.youtube.com/channel/..." 
                        value={youtubeChannelUrl} 
                        onChange={(e) => setYoutubeChannelUrl(e.target.value)}
                        disabled={isFetchingInfo}
                    />
                    <Button onClick={handleFetchChannelInfo} disabled={isFetchingInfo || !youtubeChannelUrl}>
                      {isFetchingInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch Info'}
                    </Button>
                 </div>
                 <p className="text-xs text-muted-foreground">Required for background RSS syncing.</p>
                </div>
               <div className="grid gap-2">
                  <Label htmlFor="name">Channel Name</Label>
                  <Input id="name" value={channelName} onChange={(e) => setChannelName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={channelDescription} onChange={(e) => setChannelDescription(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="region-select">Region(s)</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button id="region-select" variant="outline" className="w-full justify-start font-normal">
                        <div className="line-clamp-1 text-left">
                          {channelRegions.length > 0 ? channelRegions.join(', ') : 'Select regions...'}
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-60 max-h-60 overflow-y-auto" align="start">
                      {REGIONS.map(region => (
                        <DropdownMenuCheckboxItem
                          key={region}
                          checked={channelRegions.includes(region)}
                          onSelect={(e) => e.preventDefault()}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setChannelRegions(prev => [...prev, region]);
                            } else {
                              setChannelRegions(prev => prev.filter(r => r !== region));
                            }
                          }}
                        >
                          {region}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
            </div>
            <div className="grid gap-2 content-start">
                <Label htmlFor="logo">Channel Logo</Label>
                <div className="relative w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                    {logoPreview ? (
                        <Image src={logoPreview} alt="Logo preview" fill className="object-cover rounded-lg" />
                    ) : (
                        <Smartphone className="w-16 h-16" />
                    )}
                </div>
                <Input id="logo" type="file" accept="image/*" onChange={handleFileChange} />
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 1MB.</p>
            </div>
          </div>
        </CardContent>
        <div className="p-6 pt-0 flex justify-between">
            <div>
              {editingChannel && (
                <Button variant="outline" onClick={resetForm}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel Edit
                </Button>
              )}
            </div>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Saving...' : (editingChannel ? 'Update Channel' : 'Add Channel')}
            </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Shorts Channels</CardTitle>
          <CardDescription>View and manage all news sources for short videos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="grid gap-2">
                <Label htmlFor="region-filter">Region</Label>
                  <Select onValueChange={(value) => setRegionFilter(value === 'all' ? '' : value)} value={regionFilter || 'all'}>
                    <SelectTrigger id="region-filter" className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by region" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Regions</SelectItem>
                        {REGIONS.map(region => <SelectItem key={region} value={region}>{region}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>RSS Enabled</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChannels.map((channel) => (
                <TableRow key={channel.id}>
                  <TableCell>
                     <Avatar>
                        {channel.logoUrl ? <AvatarImage src={channel.logoUrl} alt={channel.name} /> : <Smartphone className="p-2"/>}
                        <AvatarFallback>{channel.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{channel.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                        {channel.region && (Array.isArray(channel.region) ? channel.region : [channel.region]).map(r => <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {channel.youtubeChannelId ? (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
                    ) : (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/20">Manual only</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                         <DropdownMenuItem 
                            onClick={() => handleOpenSyncDialog(channel)} 
                            disabled={!channel.youtubeChannelUrl || isSyncing}>
                          {syncingChannelId === channel.id && isSyncing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          Sync Shorts
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetEditing(channel)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(channel.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Shorts</DialogTitle>
            <DialogDescription>
              Select shorts to import into your library.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-1">
            {isSyncing ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : videosToImport.length > 0 ? (
              <div className="space-y-4">
                {videosToImport.map((video) => (
                  <div key={video.youtubeVideoId} className="flex items-center gap-4 p-2 rounded-lg border">
                    <div className="relative w-[68px] h-[120px] flex-shrink-0">
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        className="rounded-md object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold line-clamp-2">{video.title}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleImportVideo(video)}
                      disabled={importingVideoId === video.youtubeVideoId}
                    >
                      {importingVideoId === video.youtubeVideoId ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UploadCloud className="mr-2 h-4 w-4" />
                      )}
                      Import
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No recent shorts found to import.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
