'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, doc, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import {
  useCollection,
  useDoc,
  useFirebase,
  useMemoFirebase,
  useUser,
} from '../../../../firebase';
import type { Category, Channel, Podcast, PodcastContentType } from '../../../../lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Label } from '../../../../components/ui/label';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { Button } from '../../../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { ArrowLeft, Loader2, Mic, Radio, UploadCloud, Video, Youtube } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '../../../../hooks/use-toast';
import { cn } from '../../../../lib/utils';

interface DropZoneProps {
  id: string;
  accept: string;
  title: string;
  description?: string;
  file: File | null;
  onFileSelected: (file: File | null) => void;
}

function DropZone({ id, accept, title, description, file, onFileSelected }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelected(e.target.files?.[0] || null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0] || null;
    if (!droppedFile) return;
    onFileSelected(droppedFile);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{title}</Label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors select-none',
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        )}
      >
        <div className="flex flex-col items-center text-center gap-2">
          <UploadCloud className="h-6 w-6 text-primary" />
          <p className="text-sm font-medium">Drag and drop or click to browse</p>
          <p className="text-xs text-muted-foreground">{file ? file.name : description || 'Choose a file'}</p>
        </div>
      </div>
    </div>
  );
}

function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  const directIdMatch = url.match(/^[a-zA-Z0-9_-]{11}$/);
  if (directIdMatch) return url;

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '').slice(0, 11) || null;
    }
    if (parsed.searchParams.get('v')) {
      return parsed.searchParams.get('v')?.slice(0, 11) || null;
    }
    const parts = parsed.pathname.split('/').filter(Boolean);
    const embedIndex = parts.findIndex((part) => part === 'embed' || part === 'live' || part === 'shorts');
    if (embedIndex > -1 && parts[embedIndex + 1]) {
      return parts[embedIndex + 1].slice(0, 11);
    }
  } catch {
    return null;
  }

  return null;
}

export default function CreatorPodcastEditPage() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();

  const podcastId = params.podcastId as string;
  const isNew = podcastId === 'new';

  const podcastRef = useMemoFirebase(
    () => (isNew ? null : doc(firestore, 'podcasts', podcastId)),
    [firestore, isNew, podcastId]
  );
  const { data: existingPodcast, isLoading: podcastLoading } = useDoc<Podcast>(podcastRef);

  const channelsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'channels'), where('creatorId', '==', user.uid));
  }, [firestore, user]);
  const { data: channels, isLoading: channelsLoading } = useCollection<Channel>(channelsQuery);
  const categoriesQuery = useMemoFirebase(() => collection(firestore, 'categories'), [firestore]);
  const { data: categories } = useCollection<Category>(categoriesQuery);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<PodcastContentType>('audio');
  const [contentCategory, setContentCategory] = useState('My Headlines');
  const [channelId, setChannelId] = useState('none');

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const [audioUrl, setAudioUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [facebookLiveUrl, setFacebookLiveUrl] = useState('');
  const [youtubeLiveUrl, setYoutubeLiveUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!existingPodcast) return;

    setTitle(existingPodcast.title || '');
    setDescription(existingPodcast.description || '');
    setContentType(existingPodcast.contentType || 'audio');
    setContentCategory(existingPodcast.contentCategory || 'My Headlines');
    setChannelId(existingPodcast.channelId || 'none');

    setAudioUrl(existingPodcast.audioUrl || '');
    setVideoUrl(existingPodcast.videoUrl || '');
    setFacebookLiveUrl(existingPodcast.facebookLiveUrl || '');
    setThumbnailUrl(existingPodcast.thumbnailUrl || '');
    setThumbnailPreview(existingPodcast.thumbnailUrl || '');

    if (existingPodcast.youtubeVideoId) {
      setYoutubeLiveUrl(`https://www.youtube.com/watch?v=${existingPodcast.youtubeVideoId}`);
    }
  }, [existingPodcast]);

  const selectedChannelName = useMemo(() => {
    if (!channels || channelId === 'none') return 'No channel selected';
    return channels.find((c) => c.id === channelId)?.name || 'No channel selected';
  }, [channels, channelId]);

  const handleThumbnailSelect = (file: File | null) => {
    setThumbnailFile(file);
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setThumbnailPreview(preview);
  };

  const handleSave = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be signed in as a creator.' });
      return;
    }

    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'Podcast title is required.' });
      return;
    }

    if (!thumbnailFile && !thumbnailUrl) {
      toast({ variant: 'destructive', title: 'Please upload a thumbnail image.' });
      return;
    }

    if (contentType === 'audio' && !audioFile && !audioUrl) {
      toast({ variant: 'destructive', title: 'Please upload an audio file.' });
      return;
    }

    if (contentType === 'video' && !videoFile && !videoUrl) {
      toast({ variant: 'destructive', title: 'Please upload a video file.' });
      return;
    }

    if (contentType === 'facebook' && !facebookLiveUrl.trim()) {
      toast({ variant: 'destructive', title: 'Facebook Live URL is required.' });
      return;
    }

    if (contentType === 'youtube' && !youtubeLiveUrl.trim()) {
      toast({ variant: 'destructive', title: 'YouTube Live URL is required.' });
      return;
    }

    const youtubeVideoId = contentType === 'youtube' ? getYouTubeVideoId(youtubeLiveUrl.trim()) : null;
    if (contentType === 'youtube' && !youtubeVideoId) {
      toast({ variant: 'destructive', title: 'Enter a valid YouTube URL or video ID.' });
      return;
    }

    setIsSaving(true);
    try {
      let finalThumbnailUrl = thumbnailUrl;
      if (!finalThumbnailUrl && youtubeVideoId) {
        finalThumbnailUrl = `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`;
      }
      let finalAudioUrl = audioUrl;
      let finalVideoUrl = videoUrl;

      const ref = isNew ? doc(collection(firestore, 'podcasts')) : doc(firestore, 'podcasts', podcastId);
      const payload: any = {
        id: ref.id,
        title: title.trim(),
        description: description.trim(),
        contentType,
        contentCategory,
        thumbnailUrl: finalThumbnailUrl,
        creatorId: existingPodcast?.creatorId || user.uid,
        channelId: channelId === 'none' ? '' : channelId,
        createdAt: existingPodcast?.createdAt || serverTimestamp(),
        views: existingPodcast?.views || 0,
        audioUrl: '',
        videoUrl: '',
        facebookLiveUrl: '',
        youtubeVideoId: '',
      };

      if (contentType === 'audio') payload.audioUrl = finalAudioUrl;
      if (contentType === 'video') payload.videoUrl = finalVideoUrl;
      if (contentType === 'facebook') payload.facebookLiveUrl = facebookLiveUrl.trim();
      if (contentType === 'youtube') payload.youtubeVideoId = youtubeVideoId;

      await setDoc(ref, payload);

      toast({ title: isNew ? 'Podcast created' : 'Podcast updated' });
      router.push('/creator/podcasts');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to save podcast',
        description: error?.message || 'Try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (podcastLoading || channelsLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            {isNew ? 'New Podcast' : 'Edit Podcast'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload audio or video, or add Facebook Live / YouTube Live source.
          </p>
        </div>
        <Link href="/creator/podcasts">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Podcast Details</CardTitle>
          <CardDescription>
            News uploads stay in the News tab, podcast uploads stay in the Podcast tab.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="podcast-title">Title</Label>
              <Input
                id="podcast-title"
                placeholder="Enter podcast title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="podcast-description">Description</Label>
              <Textarea
                id="podcast-description"
                placeholder="Describe this podcast"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Podcast Type</Label>
              <Select value={contentType} onValueChange={(v) => setContentType(v as PodcastContentType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="audio">
                    <span className="flex items-center gap-2"><Mic className="h-4 w-4" /> Audio Upload</span>
                  </SelectItem>
                  <SelectItem value="video">
                    <span className="flex items-center gap-2"><Video className="h-4 w-4" /> Video Upload</span>
                  </SelectItem>
                  <SelectItem value="facebook">
                    <span className="flex items-center gap-2"><Radio className="h-4 w-4" /> Facebook Live URL</span>
                  </SelectItem>
                  <SelectItem value="youtube">
                    <span className="flex items-center gap-2"><Youtube className="h-4 w-4" /> YouTube Live URL</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Channel (optional)</Label>
              <Select value={channelId} onValueChange={setChannelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Channel</SelectItem>
                  {channels?.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Selected: {selectedChannelName}</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Podcast Category</Label>
              <Select value={contentCategory} onValueChange={setContentCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select podcast category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="My Headlines">My Headlines</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Podcast categories use the same list as News categories.</p>
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Media Source</h3>

            {contentType === 'audio' && (
              <DropZone
                  id="audio-file"
                  accept="audio/*"
                  title="Upload Audio File"
                  description="Supports audio files for podcast playback"
                  file={audioFile}
                  onFileSelected={setAudioFile}
                />
            )}
            {contentType === 'audio' && audioUrl && <p className="text-xs text-muted-foreground truncate">Current: {audioUrl}</p>}

            {contentType === 'video' && (
              <DropZone
                  id="video-file"
                  accept="video/*"
                  title="Upload Video File"
                  description="Supports video files for podcast playback"
                  file={videoFile}
                  onFileSelected={setVideoFile}
                />
            )}
            {contentType === 'video' && videoUrl && <p className="text-xs text-muted-foreground truncate">Current: {videoUrl}</p>}

            {contentType === 'facebook' && (
              <div className="space-y-2">
                <Label htmlFor="facebook-url">Facebook Live URL</Label>
                <Input
                  id="facebook-url"
                  placeholder="https://www.facebook.com/..."
                  value={facebookLiveUrl}
                  onChange={(e) => setFacebookLiveUrl(e.target.value)}
                />
              </div>
            )}

            {contentType === 'youtube' && (
              <div className="space-y-2">
                <Label htmlFor="youtube-url">YouTube Live URL</Label>
                <Input
                  id="youtube-url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeLiveUrl}
                  onChange={(e) => setYoutubeLiveUrl(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Thumbnail</h3>
            <div className="grid md:grid-cols-2 gap-4 items-start">
              <div className="space-y-2">
                <DropZone
                  id="thumbnail-file"
                  accept="image/*"
                  title="Upload Thumbnail"
                  description="Used on player and carousel cards"
                  file={thumbnailFile}
                  onFileSelected={handleThumbnailSelect}
                />
                <p className="text-xs text-muted-foreground">
                  This image is used in the podcast player and carousel cards.
                </p>
              </div>
              <div className="relative aspect-video rounded-md overflow-hidden bg-muted border">
                {thumbnailPreview ? (
                  <Image src={thumbnailPreview} alt="Thumbnail preview" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    <UploadCloud className="h-5 w-5 mr-2" />
                    No thumbnail selected
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link href="/creator/podcasts">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isNew ? 'Create Podcast' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
