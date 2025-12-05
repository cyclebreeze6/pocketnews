
'use client';

import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { useDoc, useCollection, useFirebase, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking, uploadFile, useStorage } from '../../../../firebase';
import type { Video, Channel, Category } from '../../../../lib/types';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { Loader2, PlusCircle, ArrowLeft } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { useState, useEffect } from 'react';
import { useToast } from '../../../../hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { fetchYouTubeVideoInfo, type YouTubeVideoInfo } from '../../../actions/youtube-info-flow';
import { Textarea } from '../../../../components/ui/textarea';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../../../components/ui/dialog';

export default function VideoEditPage() {
  const { firestore } = useFirebase();
  const storage = useStorage();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const videoId = params.videoId as string;
  const isNewVideo = videoId === 'new';

  const videoRef = useMemoFirebase(() => isNewVideo ? null : doc(firestore, 'videos', videoId), [firestore, videoId, isNewVideo]);
  const { data: existingVideo, isLoading: videoLoading } = useDoc<Video>(videoRef);
  
  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const { data: channels } = useCollection<Channel>(channelsQuery);
  
  const categoriesQuery = useMemoFirebase(() => collection(firestore, 'categories'), [firestore]);
  const { data: categories } = useCollection<Category>(categoriesQuery);

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [videoDetails, setVideoDetails] = useState<Partial<Video> | null>(null);
  
  // Dialog States
  const [isChannelDialogOpen, setIsChannelDialogOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelLogoFile, setNewChannelLogoFile] = useState<File | null>(null);
  const [newChannelLogoPreview, setNewChannelLogoPreview] = useState<string | null>(null);

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');


  useEffect(() => {
    if (existingVideo) {
      setVideoDetails({ ...existingVideo });
    }
  }, [existingVideo]);

  const handleFetchDetails = async () => {
    if (!youtubeUrl) {
      toast({ variant: 'destructive', title: 'Please enter a YouTube URL.' });
      return;
    }
    setIsFetching(true);
    try {
      const videoInfo: YouTubeVideoInfo = await fetchYouTubeVideoInfo({ videoUrl: youtubeUrl });
      if (videoInfo && videoInfo.title) {
        setVideoDetails(prev => ({
            ...prev,
            youtubeVideoId: videoInfo.videoId,
            title: videoInfo.title,
            description: videoInfo.description,
            thumbnailUrl: videoInfo.thumbnailUrl,
        }));
      } else {
        toast({ variant: 'destructive', title: 'Could not fetch video details.' });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred while fetching video details.' });
    } finally {
      setIsFetching(false);
    }
  };
  
  const handleChannelSelect = (channelId: string) => {
    if (channelId === 'add_new') {
        setNewChannelName('');
        setNewChannelLogoFile(null);
        setNewChannelLogoPreview(null);
        setIsChannelDialogOpen(true);
    } else {
        setVideoDetails(prev => ({...prev, channelId: channelId}));
    }
  }
  
  const handleCategorySelect = (categoryName: string) => {
    if (categoryName === 'add_new') {
        setNewCategoryName('');
        setIsCategoryDialogOpen(true);
    } else {
        setVideoDetails(prev => ({...prev, contentCategory: categoryName}));
    }
  }

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewChannelLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewChannelLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddChannel = async () => {
    if (!newChannelName) {
        toast({ variant: 'destructive', title: 'Please enter a channel name.' });
        return;
    }

    let logoUrl = '';
    if (newChannelLogoFile && storage) {
        try {
            const filePath = `channel-logos/${Date.now()}_${newChannelLogoFile.name}`;
            logoUrl = await uploadFile(storage, newChannelLogoFile, filePath);
        } catch (error) {
            console.error("Failed to upload logo:", error);
            toast({ variant: 'destructive', title: 'Upload failed', description: 'Could not upload the logo.' });
            return;
        }
    }
    
    const newChannelRef = doc(collection(firestore, 'channels'));
    const newChannelData: Channel = {
        id: newChannelRef.id,
        name: newChannelName,
        description: 'Newly added channel', // Default description
        createdAt: serverTimestamp(),
        logoUrl: logoUrl,
    }
    
    setDocumentNonBlocking(newChannelRef, newChannelData, {});

    setVideoDetails(prev => ({...prev, channelId: newChannelRef.id}));
    
    toast({title: 'Channel Added!', description: `${newChannelName} has been created.`});
    
    setNewChannelName('');
    setNewChannelLogoFile(null);
    setNewChannelLogoPreview(null);
    setIsChannelDialogOpen(false);
  }

  const handleAddCategory = async () => {
    if (!newCategoryName) {
        toast({ variant: 'destructive', title: 'Please enter a category name.' });
        return;
    }
    const newCategoryData = {
        name: newCategoryName,
        createdAt: serverTimestamp(),
    }
    const newDocRef = await addDocumentNonBlocking(collection(firestore, 'categories'), newCategoryData);
    if(newDocRef) {
        updateDocumentNonBlocking(newDocRef, {id: newDocRef.id});
        setVideoDetails(prev => ({...prev, contentCategory: newCategoryName}));
    }
    toast({title: 'Category Added!', description: `${newCategoryName} has been created.`});
    setNewCategoryName('');
    setIsCategoryDialogOpen(false);
  }

  const handleSaveChanges = async () => {
    if (!videoDetails?.title || !videoDetails?.channelId || !videoDetails?.contentCategory) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please ensure a title, channel, and category are set.' });
      return;
    }
    
    setIsSaving(true);
    const dataToSave = {
      ...videoDetails,
      views: videoDetails.views || Math.floor(Math.random() * 100000),
      watchTime: videoDetails.watchTime || Math.floor(Math.random() * 2000),
    };

    if (isNewVideo) {
      dataToSave.createdAt = serverTimestamp();
      const newDocRef = await addDocumentNonBlocking(collection(firestore, 'videos'), dataToSave);
      if(newDocRef) {
        updateDocumentNonBlocking(newDocRef, { id: newDocRef.id });
      }
      toast({ title: 'Video Added!', description: `${dataToSave.title} has been added.` });
    } else {
      setDocumentNonBlocking(videoRef!, dataToSave, { merge: true });
      toast({ title: 'Video Updated!', description: `${dataToSave.title} has been updated.` });
    }
    setIsSaving(false);
    router.push('/creator/videos');
  };
  
  if (videoLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                {isNewVideo ? 'Add New Video' : 'Edit Video'}
            </h1>
        </div>
      
        <Card>
            <CardHeader>
                <CardTitle>Video Details</CardTitle>
                <CardDescription>
                {isNewVideo ? 'Fetch details from a YouTube URL or enter them manually.' : 'Edit the details for this video.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {isNewVideo && (
                     <div className="grid gap-2">
                        <Label htmlFor="youtube-url">YouTube URL</Label>
                        <div className="flex gap-2">
                            <Input
                            id="youtube-url"
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            disabled={isFetching}
                            />
                            <Button onClick={handleFetchDetails} disabled={isFetching || !youtubeUrl}>
                            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch'}
                            </Button>
                        </div>
                    </div>
                )}
               
                {videoDetails && (
                <div className="grid md:grid-cols-3 gap-6 items-start">
                    <div className="md:col-span-1">
                        <Label>Thumbnail</Label>
                        {videoDetails.thumbnailUrl && (
                            <Image src={videoDetails.thumbnailUrl} alt={videoDetails.title || 'Video thumbnail'} width={320} height={180} className="rounded-md mt-2 aspect-video object-cover" />
                        )}
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" value={videoDetails.title || ''} onChange={e => setVideoDetails(prev => ({...prev, title: e.target.value}))} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={videoDetails.description || ''} onChange={e => setVideoDetails(prev => ({...prev, description: e.target.value}))} className="h-24" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="channel-select">Assign to Channel</Label>
                                <Select onValueChange={handleChannelSelect} value={videoDetails.channelId || ''}>
                                    <SelectTrigger id="channel-select">
                                        <SelectValue placeholder="Select a channel..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {channels?.map((channel) => (
                                        <SelectItem key={channel.id} value={channel.id}>
                                            {channel.name}
                                        </SelectItem>
                                        ))}
                                        <SelectItem value="add_new" className="text-primary">
                                            <PlusCircle className="inline-block mr-2 h-4 w-4" /> Add New Channel
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="category-select">Assign to Category</Label>
                                <Select onValueChange={handleCategorySelect} value={videoDetails.contentCategory || ''}>
                                    <SelectTrigger id="category-select">
                                        <SelectValue placeholder="Select a category..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories?.map((category) => (
                                        <SelectItem key={category.id} value={category.name}>
                                            {category.name}
                                        </SelectItem>
                                        ))}
                                        <SelectItem value="add_new" className="text-primary">
                                            <PlusCircle className="inline-block mr-2 h-4 w-4" /> Add New Category
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
                )}

            </CardContent>
            <div className="p-6 pt-0">
                 <Button onClick={handleSaveChanges} disabled={isSaving || !videoDetails}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
                </Button>
            </div>
        </Card>
        
        <Dialog open={isChannelDialogOpen} onOpenChange={setIsChannelDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Channel</DialogTitle>
                    <DialogDescription>Create a new channel to assign this video to.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="new-channel-name">Channel Name</Label>
                        <Input id="new-channel-name" value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="logo">Channel Logo</Label>
                        <div className="relative w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                            {newChannelLogoPreview ? (
                                <Image src={newChannelLogoPreview} alt="Logo preview" layout="fill" className="object-cover rounded-lg" />
                            ) : (
                                <span>Logo</span>
                            )}
                        </div>
                        <Input id="logo" type="file" accept="image/*" onChange={handleLogoFileChange} className="text-sm"/>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsChannelDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddChannel}>Add Channel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                    <DialogDescription>Create a new category to assign this video to.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="new-category-name">Category Name</Label>
                        <Input id="new-category-name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddCategory}>Add Category</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
