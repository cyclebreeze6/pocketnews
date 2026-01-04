'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Checkbox } from '../../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useToast } from '../../../hooks/use-toast';
import { Loader2, DownloadCloud, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { fetchNewVideosForBulkImport, saveImportedVideos } from '../../actions/bulk-import-actions';
import type { NewVideoForImport, ImportedVideoSaveData } from '../../actions/bulk-import-actions';
import { useCollection, useFirebase, useMemoFirebase } from '../../../firebase';
import type { Category } from '../../../lib/types';
import { collection } from 'firebase/firestore';

const MAX_SELECTABLE_VIDEOS = 10;

export default function CreatorBulkImportPage() {
  const { firestore } = useFirebase();
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchedVideos, setFetchedVideos] = useState<NewVideoForImport[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<NewVideoForImport[]>([]);
  const [assignedCategory, setAssignedCategory] = useState<string>('');
  const { toast } = useToast();

  const categoriesQuery = useMemoFirebase(() => collection(firestore, 'categories'), [firestore]);
  const { data: categories } = useCollection<Category>(categoriesQuery);

  const handleFetchVideos = async () => {
    setIsFetching(true);
    setFetchedVideos([]);
    setSelectedVideos([]);

    try {
      const results = await fetchNewVideosForBulkImport();
      setFetchedVideos(results);
      if (results.length === 0) {
        toast({ title: 'No new videos found', description: 'All linked channels are up-to-date.' });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to fetch videos',
        description: error.message,
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleVideoSelection = (video: NewVideoForImport, isSelected: boolean) => {
    if (isSelected) {
      if (selectedVideos.length < MAX_SELECTABLE_VIDEOS) {
        setSelectedVideos((prev) => [...prev, video]);
      } else {
        toast({
          variant: 'destructive',
          title: `You can select a maximum of ${MAX_SELECTABLE_VIDEOS} videos.`,
        });
      }
    } else {
      setSelectedVideos((prev) => prev.filter((v) => v.youtubeVideoId !== video.youtubeVideoId));
    }
  };

  const handleImport = async () => {
    if (selectedVideos.length === 0) {
      toast({ variant: 'destructive', title: 'No videos selected' });
      return;
    }
    if (!assignedCategory) {
      toast({ variant: 'destructive', title: 'Please assign a category' });
      return;
    }

    setIsSaving(true);
    const videosToSave: ImportedVideoSaveData[] = selectedVideos.map(v => ({
      ...v,
      contentCategory: assignedCategory,
      views: Math.floor(Math.random() * 100), // Placeholder
      watchTime: Math.floor(Math.random() * 100), // Placeholder
    }));

    try {
      await saveImportedVideos(videosToSave);
      toast({
        title: 'Import Successful!',
        description: `${selectedVideos.length} videos have been added to your library.`,
      });
      // Remove imported videos from the fetched list
      setFetchedVideos(prev => prev.filter(v => !selectedVideos.some(sv => sv.youtubeVideoId === v.youtubeVideoId)));
      setSelectedVideos([]);
      setAssignedCategory('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Import Failed', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">Bulk Import</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Step 1: Fetch New Videos</CardTitle>
          <CardDescription>Sync with all your linked YouTube channels to find videos that haven't been imported yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleFetchVideos} disabled={isFetching}>
            {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DownloadCloud className="mr-2 h-4 w-4" />}
            {isFetching ? 'Fetching...' : 'Fetch New Videos'}
          </Button>
        </CardContent>
      </Card>

      {fetchedVideos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Select and Import</CardTitle>
            <CardDescription>Choose up to {MAX_SELECTABLE_VIDEOS} videos, assign a category, and import them all at once.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-grow grid gap-2">
                    <label className="text-sm font-medium">Assign Category</label>
                    <Select onValueChange={setAssignedCategory} value={assignedCategory}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a category for import..." />
                        </SelectTrigger>
                        <SelectContent>
                            {categories?.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="self-end">
                    <Button onClick={handleImport} disabled={isSaving || selectedVideos.length === 0 || !assignedCategory}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                        Import {selectedVideos.length > 0 ? `(${selectedVideos.length})` : ''} Selected
                    </Button>
                </div>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {fetchedVideos.map((video) => (
                <div key={video.youtubeVideoId} className="flex items-center gap-4 p-2 border rounded-lg">
                  <Checkbox
                    id={`video-${video.youtubeVideoId}`}
                    checked={selectedVideos.some((v) => v.youtubeVideoId === video.youtubeVideoId)}
                    onCheckedChange={(checked) => handleVideoSelection(video, !!checked)}
                    disabled={!selectedVideos.some(v => v.youtubeVideoId === video.youtubeVideoId) && selectedVideos.length >= MAX_SELECTABLE_VIDEOS}
                  />
                  <label htmlFor={`video-${video.youtubeVideoId}`} className="flex-grow flex items-center gap-4 cursor-pointer">
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      width={120}
                      height={68}
                      className="rounded-md aspect-video object-cover"
                    />
                    <div className="flex-grow">
                      <p className="font-semibold line-clamp-2">{video.title}</p>
                      <p className="text-xs text-muted-foreground">{video.channelName}</p>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
