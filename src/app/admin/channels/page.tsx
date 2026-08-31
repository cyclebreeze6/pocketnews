'use client';

import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { useCollection, useFirebase, useMemoFirebase, deleteDocumentNonBlocking } from '../../../firebase';
import type { Channel, IptvChannel } from '../../../lib/types';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal, Trash2, Loader2, X, Tv, RefreshCw, UploadCloud, Radio, Rss, Globe, Copy, ExternalLink } from 'lucide-react';
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
import { fetchChannelVideosAction as fetchChannelVideos } from '../../actions/youtube-channel-videos-flow';
import { fetchYouTubeChannelInfo } from '../../actions/youtube-channel-info-flow';
export interface YouTubeVideoDetails {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt?: string;
  authorName?: string;
}
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { REGIONS } from '../../../lib/constants';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { syncTdtChannelsAction } from '../../actions/iptv-sync-actions';

export default function AdminChannelsPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  // YouTube Channels
  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const { data: channels } = useCollection<Channel>(channelsQuery);

  // IPTV Channels
  const iptvQuery = useMemoFirebase(() => collection(firestore, 'iptv_channels'), [firestore]);
  const { data: iptvChannels, isLoading: iptvLoading } = useCollection<IptvChannel>(iptvQuery);

  // Form states - YouTube Channels
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [youtubeChannelUrl, setYoutubeChannelUrl] = useState('');
  const [youtubeChannelId, setYoutubeChannelId] = useState('');
  const [channelRegions, setChannelRegions] = useState<string[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [regionFilter, setRegionFilter] = useState('');

  // Sync YouTube videos state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingChannelId, setSyncingChannelId] = useState<string | null>(null);
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [videosToImport, setVideosToImport] = useState<YouTubeVideoDetails[]>([]);

  // Form states - IPTV Channels
  const [iptvName, setIptvName] = useState('');
  const [iptvLogoUrl, setIptvLogoUrl] = useState('');
  const [iptvM3u8Url, setIptvM3u8Url] = useState('');
  const [iptvType, setIptvType] = useState<'tv' | 'radio'>('tv');
  const [iptvCategory, setIptvCategory] = useState('Generalistas');
  const [iptvCountry, setIptvCountry] = useState('Spain');
  const [iptvEpgId, setIptvEpgId] = useState('');
  const [editingIptvChannel, setEditingIptvChannel] = useState<IptvChannel | null>(null);
  const [isIptvSaving, setIsIptvSaving] = useState(false);

  // Filter IPTV states
  const [iptvTypeFilter, setIptvTypeFilter] = useState<'all' | 'tv' | 'radio'>('all');
  const [iptvSearch, setIptvSearch] = useState('');
  const [isTdtSyncing, setIsTdtSyncing] = useState(false);

  // Handlers - YouTube Channels
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
      toast({ title: "Channel info populated! ID, logo, and regions set automatically." });
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Failed to fetch info', description: error.message });
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const resetYouTubeForm = () => {
    setChannelName('');
    setChannelDescription('');
    setYoutubeChannelUrl('');
    setYoutubeChannelId('');
    setChannelRegions([]);
    setLogoPreview(null);
    setEditingChannel(null);
  };

  const handleSetEditingYouTube = (channel: Channel | null) => {
    if (channel) {
      setEditingChannel(channel);
      setChannelName(channel.name);
      setChannelDescription(channel.description);
      setYoutubeChannelUrl(channel.youtubeChannelUrl || '');
      setYoutubeChannelId(channel.youtubeChannelId || '');
      setChannelRegions(Array.isArray(channel.region) ? channel.region : (channel.region ? [channel.region] : []));
      setLogoPreview(channel.logoUrl || null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      resetYouTubeForm();
    }
  };

  const handleSaveYouTubeChannel = async () => {
    if (!channelName || !channelDescription) {
      toast({ variant: 'destructive', title: 'Please fill out name and description.' });
      return;
    }

    setIsSaving(true);
    try {
      const finalLogoUrl = logoPreview || editingChannel?.logoUrl || '';

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
      resetYouTubeForm();
    } catch (error) {
      console.error("Failed to save channel:", error);
      toast({ variant: 'destructive', title: 'Save failed', description: 'Could not save channel data.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteYouTubeChannel = (channelId: string) => {
    if (confirm('Are you sure you want to delete this channel?')) {
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
      const videos = await fetchChannelVideos({ 
        channelUrl: channel.youtubeChannelUrl,
        channelId: channel.youtubeChannelId 
      });
      setVideosToImport(videos);
      if (videos.length === 0) {
        toast({ title: 'No recent videos found.' });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to fetch videos', description: error.message || 'Could not fetch videos.' });
      setIsSyncDialogOpen(false); 
    } finally {
      setIsSyncing(false);
      setSyncingChannelId(null);
    }
  };

  const handleImportVideo = (video: YouTubeVideoDetails) => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
    router.push(`/creator/videos/new?youtubeUrl=${encodeURIComponent(youtubeUrl)}`);
    setIsSyncDialogOpen(false);
  };

  // Handlers - IPTV Channels
  const resetIptvForm = () => {
    setIptvName('');
    setIptvLogoUrl('');
    setIptvM3u8Url('');
    setIptvType('tv');
    setIptvCategory('Generalistas');
    setIptvCountry('Spain');
    setIptvEpgId('');
    setEditingIptvChannel(null);
  };

  const handleSetEditingIptv = (channel: IptvChannel | null) => {
    if (channel) {
      setEditingIptvChannel(channel);
      setIptvName(channel.name);
      setIptvLogoUrl(channel.logoUrl);
      setIptvM3u8Url(channel.m3u8Url);
      setIptvType(channel.type);
      setIptvCategory(channel.category || 'Generalistas');
      setIptvCountry(channel.country || 'Spain');
      setIptvEpgId(channel.epgId || '');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      resetIptvForm();
    }
  };

  const handleSaveIptvChannel = async () => {
    if (!iptvName || !iptvM3u8Url) {
      toast({ variant: 'destructive', title: 'Please provide Channel Name and M3U8 Stream URL.' });
      return;
    }

    setIsIptvSaving(true);
    try {
      const channelId = editingIptvChannel
        ? editingIptvChannel.id
        : (iptvName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + iptvType + '-' + Date.now());

      const docRef = doc(firestore, 'iptv_channels', channelId);
      const iptvData = {
        id: channelId,
        name: iptvName.trim(),
        logoUrl: iptvLogoUrl.trim(),
        m3u8Url: iptvM3u8Url.trim(),
        type: iptvType,
        category: iptvCategory.trim(),
        country: iptvCountry.trim(),
        epgId: iptvEpgId.trim(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, iptvData, { merge: true });
      toast({ title: editingIptvChannel ? 'IPTV Channel updated!' : 'IPTV Channel created!' });
      resetIptvForm();
    } catch (err: any) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Save failed', description: err.message });
    } finally {
      setIsIptvSaving(false);
    }
  };

  const handleDeleteIptvChannel = (channelId: string) => {
    if (confirm('Are you sure you want to delete this IPTV channel?')) {
      const channelRef = doc(firestore, 'iptv_channels', channelId);
      deleteDocumentNonBlocking(channelRef);
      toast({ title: 'IPTV Channel deleted.' });
    }
  };

  const handleSyncTdtChannels = async () => {
    setIsTdtSyncing(true);
    try {
      const res = await syncTdtChannelsAction();
      if (res.success) {
        toast({
          title: 'TDTChannels Auto-Sync Complete!',
          description: res.message,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Sync failed',
          description: res.message,
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error syncing TDTChannels',
        description: err.message,
      });
    } finally {
      setIsTdtSyncing(false);
    }
  };

  // Filtered YouTube Channels
  const filteredChannels = useMemo(() => {
    if (!channels) return [];
    return channels.filter(channel => {
      const regionMatch = !regionFilter || (Array.isArray(channel.region) ? channel.region.includes(regionFilter) : channel.region === regionFilter);
      return regionMatch;
    });
  }, [channels, regionFilter]);

  // Filtered IPTV Channels
  const filteredIptvChannels = useMemo(() => {
    if (!iptvChannels) return [];
    return iptvChannels.filter(channel => {
      const typeMatch = iptvTypeFilter === 'all' || channel.type === iptvTypeFilter;
      const searchMatch = !iptvSearch || 
        channel.name.toLowerCase().includes(iptvSearch.toLowerCase()) || 
        channel.category?.toLowerCase().includes(iptvSearch.toLowerCase());
      return typeMatch && searchMatch;
    });
  }, [iptvChannels, iptvTypeFilter, iptvSearch]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Manage Channels</h1>
          <p className="text-muted-foreground text-sm">Configure YouTube RSS channels and IPTV Live TV/Radio streams (TDTChannels).</p>
        </div>

        <Button
          onClick={handleSyncTdtChannels}
          disabled={isTdtSyncing}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg"
        >
          {isTdtSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {isTdtSyncing ? 'Syncing TDTChannels...' : 'Auto-Sync TDTChannels'}
        </Button>
      </div>

      <Tabs defaultValue="iptv" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="iptv" className="flex items-center gap-2">
            <Tv className="h-4 w-4 text-cyan-400" />
            IPTV Channels ({iptvChannels?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="youtube" className="flex items-center gap-2">
            <Rss className="h-4 w-4 text-red-400" />
            YouTube News Channels ({channels?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* ── IPTV CHANNELS TAB CONTENT ───────────────────────────── */}
        <TabsContent value="iptv" className="space-y-6">
          {/* Add / Edit IPTV Channel Form */}
          <Card>
            <CardHeader>
              <CardTitle>{editingIptvChannel ? 'Edit IPTV Stream' : 'Add Custom IPTV Channel'}</CardTitle>
              <CardDescription>
                {editingIptvChannel ? `Editing "${editingIptvChannel.name}"` : 'Fill out details to add a new Live TV or Radio stream.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 grid gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="iptv-name">Channel Name</Label>
                      <Input
                        id="iptv-name"
                        placeholder="e.g. La 1, Canal 24 Horas, RNE"
                        value={iptvName}
                        onChange={(e) => setIptvName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="iptv-type">Stream Type</Label>
                      <Select value={iptvType} onValueChange={(val: 'tv' | 'radio') => setIptvType(val)}>
                        <SelectTrigger id="iptv-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tv">Live TV</SelectItem>
                          <SelectItem value="radio">Live Radio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="iptv-url">M3U8 Stream URL</Label>
                    <Input
                      id="iptv-url"
                      placeholder="https://domain.com/live/playlist.m3u8"
                      value={iptvM3u8Url}
                      onChange={(e) => setIptvM3u8Url(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="iptv-category">Category</Label>
                      <Input
                        id="iptv-category"
                        placeholder="Generalistas, Noticias, Deportes"
                        value={iptvCategory}
                        onChange={(e) => setIptvCategory(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="iptv-country">Country</Label>
                      <Input
                        id="iptv-country"
                        placeholder="Spain, International"
                        value={iptvCountry}
                        onChange={(e) => setIptvCountry(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="iptv-epg">EPG ID (Optional)</Label>
                      <Input
                        id="iptv-epg"
                        placeholder="e.g. La1.TV"
                        value={iptvEpgId}
                        onChange={(e) => setIptvEpgId(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 content-start">
                  <Label htmlFor="iptv-logo">Channel Logo URL</Label>
                  <Input
                    id="iptv-logo"
                    placeholder="https://..."
                    value={iptvLogoUrl}
                    onChange={(e) => setIptvLogoUrl(e.target.value)}
                  />
                  <div className="relative w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground mt-2 bg-muted/30">
                    {iptvLogoUrl ? (
                      <Image src={iptvLogoUrl} alt="Logo preview" fill className="object-contain p-2 rounded-lg" />
                    ) : (
                      iptvType === 'radio' ? <Radio className="w-12 h-12" /> : <Tv className="w-12 h-12" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex justify-between">
              <div>
                {editingIptvChannel && (
                  <Button variant="outline" onClick={resetIptvForm}>
                    <X className="mr-2 h-4 w-4" /> Cancel Edit
                  </Button>
                )}
              </div>
              <Button onClick={handleSaveIptvChannel} disabled={isIptvSaving}>
                {isIptvSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isIptvSaving ? 'Saving...' : (editingIptvChannel ? 'Update IPTV Channel' : 'Add IPTV Channel')}
              </Button>
            </div>
          </Card>

          {/* List of IPTV Channels */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <CardTitle>All IPTV Channels</CardTitle>
                <CardDescription>Live streams from TDTChannels & Custom M3U8 links.</CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Search IPTV channels..."
                  value={iptvSearch}
                  onChange={(e) => setIptvSearch(e.target.value)}
                  className="w-full sm:w-48"
                />
                <Select value={iptvTypeFilter} onValueChange={(val: 'all' | 'tv' | 'radio') => setIptvTypeFilter(val)}>
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="Filter Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="tv">Live TV Only</SelectItem>
                    <SelectItem value="radio">Radio Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {iptvLoading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Logo</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>EPG ID</TableHead>
                      <TableHead>M3U8 Stream</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIptvChannels.map((channel) => (
                      <TableRow key={channel.id}>
                        <TableCell>
                          <Avatar className="h-9 w-9 bg-muted">
                            {channel.logoUrl ? <AvatarImage src={channel.logoUrl} alt={channel.name} className="object-contain p-1" /> : (channel.type === 'radio' ? <Radio className="p-2"/> : <Tv className="p-2"/>)}
                            <AvatarFallback>{channel.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-semibold">{channel.name}</TableCell>
                        <TableCell>
                          {channel.type === 'radio' ? (
                            <Badge variant="outline" className="text-purple-400 border-purple-500/30 bg-purple-500/10">Radio</Badge>
                          ) : (
                            <Badge variant="outline" className="text-cyan-400 border-cyan-500/30 bg-cyan-500/10">TV</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{channel.category}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {channel.epgId || '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                            <span className="truncate">{channel.m3u8Url}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0"
                              onClick={() => {
                                navigator.clipboard.writeText(channel.m3u8Url);
                                toast({ title: 'Stream link copied!' });
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleSetEditingIptv(channel)}>
                                Edit
                              </DropdownMenuItem>
                              {channel.web && (
                                <DropdownMenuItem onClick={() => window.open(channel.web, '_blank')}>
                                  <ExternalLink className="mr-2 h-4 w-4" /> Official Web
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleDeleteIptvChannel(channel.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredIptvChannels.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No IPTV channels found. Click "Auto-Sync TDTChannels" to import Spanish/International live TV and radio streams!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── YOUTUBE CHANNELS TAB CONTENT ────────────────────────── */}
        <TabsContent value="youtube" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingChannel ? 'Edit YouTube Channel' : 'Add New YouTube Channel'}</CardTitle>
              <CardDescription>
                {editingChannel ? `Editing "${editingChannel.name}"` : 'Add YouTube channels for automatic video RSS syncing.'}
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
                      <Tv className="w-16 h-16" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex justify-between">
              <div>
                {editingChannel && (
                  <Button variant="outline" onClick={resetYouTubeForm}>
                    <X className="mr-2 h-4 w-4" /> Cancel Edit
                  </Button>
                )}
              </div>
              <Button onClick={handleSaveYouTubeChannel} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Saving...' : (editingChannel ? 'Update Channel' : 'Add Channel')}
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All YouTube Channels</CardTitle>
              <CardDescription>View and manage all YouTube news sources.</CardDescription>
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
                    <TableHead>Status</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChannels.map((channel) => (
                    <TableRow key={channel.id}>
                      <TableCell>
                        <Avatar>
                          {channel.logoUrl ? <AvatarImage src={channel.logoUrl} alt={channel.name} /> : <Tv className="p-2"/>}
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
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleOpenSyncDialog(channel)} 
                              disabled={!channel.youtubeChannelUrl || syncingChannelId === channel.id}>
                              {syncingChannelId === channel.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                              )}
                              Sync Latest
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSetEditingYouTube(channel)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteYouTubeChannel(channel.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
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
        </TabsContent>
      </Tabs>
      
      {/* Import Dialog */}
      <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Videos</DialogTitle>
            <DialogDescription>
              Select videos to import into your library.
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
                  <div key={video.videoId} className="flex items-center gap-4 p-2 rounded-lg border">
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      width={120}
                      height={68}
                      className="rounded-md aspect-video object-cover"
                    />
                    <div className="flex-grow">
                      <p className="font-semibold line-clamp-2">{video.title}</p>
                      <p className="text-xs text-muted-foreground">{video.authorName}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleImportVideo(video)}>
                      <UploadCloud className="mr-2 h-4 w-4" /> Import
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No recent videos found to import.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
