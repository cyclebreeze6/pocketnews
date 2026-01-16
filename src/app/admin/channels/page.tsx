
'use client';

import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { useCollection, useFirebase, useMemoFirebase, deleteDocumentNonBlocking, setDocumentNonBlocking, uploadFile, useStorage, addDocumentNonBlocking } from '../../../firebase';
import type { Channel } from '../../../lib/types';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal, Trash2, Loader2, X, Tv, RefreshCw, UploadCloud } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useState } from 'react';
import { useToast } from '../../../hooks/use-toast';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Textarea } from '../../../components/ui/textarea';
import { fetchChannelVideos } from '../../actions/youtube-channel-videos-flow';
import type { YouTubeVideoDetails } from '../../ai/flows/youtube-channel-videos-flow';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { LANGUAGES, REGIONS } from '../../../lib/constants';


export default function AdminChannelsPage() {
  const { firestore } = useFirebase();
  const storage = useStorage();
  const { toast } = useToast();
  const router = useRouter();

  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const { data: channels } = useCollection<Channel>(channelsQuery);

  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [youtubeChannelUrl, setYoutubeChannelUrl] = useState('');
  const [channelLanguage, setChannelLanguage] = useState('');
  const [channelRegion, setChannelRegion] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingChannelId, setSyncingChannelId] = useState<string | null>(null);
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [videosToImport, setVideosToImport] = useState<YouTubeVideoDetails[]>([]);


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
    setChannelLanguage('');
    setChannelRegion('');
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
      setChannelLanguage(channel.language || '');
      setChannelRegion(channel.region || '');
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
        }

        const channelData = {
          name: channelName,
          description: channelDescription,
          youtubeChannelUrl: youtubeChannelUrl,
          logoUrl: finalLogoUrl,
          language: channelLanguage,
          region: channelRegion,
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
        const videos = await fetchChannelVideos({ channelUrl: channel.youtubeChannelUrl });
        setVideosToImport(videos);
        if (videos.length === 0) {
            toast({ title: 'No recent videos found.' });
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to fetch videos', description: error.message || 'Could not fetch videos for this channel.' });
        setIsSyncDialogOpen(false); // Close dialog on error
    } finally {
        setIsSyncing(false);
        setSyncingChannelId(null);
    }
  };

  const handleImportVideo = (video: YouTubeVideoDetails) => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
    // Redirect to the new video page with the URL pre-filled
    router.push(`/creator/videos/new?youtubeUrl=${encodeURIComponent(youtubeUrl)}`);
    setIsSyncDialogOpen(false); // Close the dialog after initiating import
  };


  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Manage Channels</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingChannel ? 'Edit Channel' : 'Add New Channel'}</CardTitle>
          <CardDescription>
            {editingChannel ? `Editing the channel "${editingChannel.name}"` : 'Fill out the form below to add a new channel.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 grid gap-4">
               <div className="grid gap-2">
                 <Label htmlFor="youtube-url">YouTube Channel URL</Label>
                 <Input 
                     id="youtube-url" 
                     placeholder="https://www.youtube.com/channel/..." 
                     value={youtubeChannelUrl} 
                     onChange={(e) => setYoutubeChannelUrl(e.target.value)}
                 />
                 <p className="text-xs text-muted-foreground">Optional. Used for syncing videos from this channel.</p>
                </div>
               <div className="grid gap-2">
                  <Label htmlFor="name">Channel Name</Label>
                  <Input id="name" value={channelName} onChange={(e) => setChannelName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={channelDescription} onChange={(e) => setChannelDescription(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="language-select">Language</Label>
                    <Select onValueChange={setChannelLanguage} value={channelLanguage}>
                        <SelectTrigger id="language-select">
                            <SelectValue placeholder="Select language..." />
                        </SelectTrigger>
                        <SelectContent>
                            {LANGUAGES.map(lang => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="region-select">Region</Label>
                    <Select onValueChange={setChannelRegion} value={channelRegion}>
                        <SelectTrigger id="region-select">
                            <SelectValue placeholder="Select region..." />
                        </SelectTrigger>
                        <SelectContent>
                            {REGIONS.map(region => <SelectItem key={region} value={region}>{region}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                </div>
            </div>
            <div className="grid gap-2 content-start">
                <Label htmlFor="logo">Channel Logo</Label>
                <div className="relative w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                    {logoPreview ? (
                        <Image src={logoPreview} alt="Logo preview" layout="fill" className="object-cover rounded-lg" />
                    ) : (
                        <Tv className="w-16 h-16" />
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
        <CardContent className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>YouTube URL</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels?.map((channel) => (
                <TableRow key={channel.id}>
                  <TableCell>
                     <Avatar>
                        {channel.logoUrl ? <AvatarImage src={channel.logoUrl} alt={channel.name} /> : <Tv className="p-2"/>}
                        <AvatarFallback>{channel.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{channel.name}</TableCell>
                  <TableCell className="line-clamp-2">{channel.description}</TableCell>
                  <TableCell>{channel.language}</TableCell>
                  <TableCell>{channel.region}</TableCell>
                  <TableCell className="text-xs text-muted-foreground line-clamp-1">{channel.youtubeChannelUrl}</TableCell>
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
                            disabled={!channel.youtubeChannelUrl || syncingChannelId === channel.id}>
                          {syncingChannelId === channel.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          Sync
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
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Import
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

    