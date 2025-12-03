'use client';

import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { useCollection, useFirebase, useMemoFirebase, deleteDocumentNonBlocking, addDocumentNonBlocking } from '../../../firebase';
import type { Video, Channel } from '../../../lib/types';
import { collection, Timestamp, doc } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal, Trash2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useState, useEffect } from 'react';
import { useToast } from '../../../hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { fetchYouTubeVideoInfo, type YouTubeVideoInfo } from '../../../ai/flows/youtube-info-flow';
import { Textarea } from '../../../components/ui/textarea';

function toDate(timestamp: Timestamp | Date | string): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
}

export default function AdminVideosPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const videosQuery = useMemoFirebase(() => collection(firestore, 'videos'), [firestore]);
  const { data: videos } = useCollection<Video>(videosQuery);
  
  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const { data: channels } = useCollection<Channel>(channelsQuery);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [videoDetails, setVideoDetails] = useState<YouTubeVideoInfo | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>('');

  const resetDialog = () => {
    setYoutubeUrl('');
    setIsFetching(false);
    setVideoDetails(null);
    setSelectedChannel('');
    setIsDialogOpen(false);
  };
  
  const handleFetchDetails = async () => {
    if (!youtubeUrl) {
      toast({ variant: 'destructive', title: 'Please enter a YouTube URL.' });
      return;
    }

    setIsFetching(true);
    try {
      const videoInfo = await fetchYouTubeVideoInfo({ videoUrl: youtubeUrl });
      if (videoInfo && videoInfo.title) {
        setVideoDetails(videoInfo);
      } else {
        toast({ variant: 'destructive', title: 'Could not fetch video details.', description: 'Please check the URL and try again.' });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred while fetching video details.' });
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddVideo = async () => {
    if (!videoDetails || !selectedChannel) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fetch video details and select a channel.' });
        return;
    }

    const videosCollection = collection(firestore, 'videos');
    addDocumentNonBlocking(videosCollection, {
        youtubeVideoId: videoDetails.videoId,
        title: videoDetails.title,
        description: videoDetails.description,
        thumbnailUrl: videoDetails.thumbnailUrl,
        channelId: selectedChannel,
        views: Math.floor(Math.random() * 100000), // Placeholder
        watchTime: Math.floor(Math.random() * 2000), // Placeholder
        createdAt: new Date(),
        contentCategory: channels?.find(c => c.id === selectedChannel)?.name || 'General',
    });

    toast({ title: 'Video Added!', description: `${videoDetails.title} has been added.` });
    resetDialog();
  };

  const handleDelete = (videoId: string) => {
    if (confirm('Are you sure you want to delete this video?')) {
      const videoRef = doc(firestore, 'videos', videoId);
      deleteDocumentNonBlocking(videoRef);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Manage Videos</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Video
        </Button>
      </div>

      <Card>
        <CardContent className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead className="hidden md:table-cell">Created at</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos?.map(video => (
                <TableRow key={video.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={video.title}
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={video.thumbnailUrl}
                      width="64"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{video.title}</TableCell>
                  <TableCell>{channels?.find(c => c.id === video.channelId)?.name || video.channelId}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {toDate(video.createdAt).toLocaleDateString()}
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
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(video.id)} className="text-destructive">
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
      
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Video</DialogTitle>
            <DialogDescription>
              Enter a YouTube video URL to automatically fetch its details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <div className="flex gap-2">
                <Input
                  id="youtube-url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  disabled={isFetching || !!videoDetails}
                />
                <Button onClick={handleFetchDetails} disabled={isFetching || !youtubeUrl || !!videoDetails}>
                  {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch'}
                </Button>
              </div>
            </div>

            {videoDetails && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex gap-4">
                    <Image src={videoDetails.thumbnailUrl} alt={videoDetails.title} width={160} height={90} className="rounded-md" />
                    <div className="space-y-1">
                        <h3 className="font-semibold">{videoDetails.title}</h3>
                        <p className="text-sm text-muted-foreground">{videoDetails.authorName}</p>
                    </div>
                </div>

                <div className="grid gap-2">
                  <Label>Title</Label>
                  <Input value={videoDetails.title} disabled />
                </div>
                 <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea value={videoDetails.description} className="h-24" disabled />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="channel-select">Assign to Channel</Label>
                  <Select onValueChange={setSelectedChannel} value={selectedChannel}>
                    <SelectTrigger id="channel-select">
                      <SelectValue placeholder="Select a channel..." />
                    </SelectTrigger>
                    <SelectContent>
                      {channels?.map((channel) => (
                        <SelectItem key={channel.id} value={channel.id}>
                          {channel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetDialog}>Cancel</Button>
            <Button onClick={handleAddVideo} disabled={!videoDetails || !selectedChannel}>Add Video</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
