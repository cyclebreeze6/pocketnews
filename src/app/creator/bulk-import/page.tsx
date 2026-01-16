
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
import { LANGUAGES, REGIONS } from '../../../lib/constants';

interface VideoToImport extends NewVideoForImport {
  category?: string;
  language?: string;
  region?: string;
  isSelected?: boolean;
}

export default function CreatorBulkImportPage() {
  const { firestore } = useFirebase();
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchedVideos, setFetchedVideos] = useState<VideoToImport[]>([]);
  const { toast } = useToast();

  const categoriesQuery = useMemoFirebase(() => collection(firestore, 'categories'), [firestore]);
  const { data: categories } = useCollection<Category>(categoriesQuery);

  const handleFetchVideos = async () => {
    setIsFetching(true);
    setFetchedVideos([]);

    try {
      const results = await fetchNewVideosForBulkImport();
      setFetchedVideos(results.map(v => ({ ...v, isSelected: false })));
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

  const handleVideoSelection = (videoId: string, isSelected: boolean) => {
    setFetchedVideos(prev =>
      prev.map(v => (v.youtubeVideoId === videoId ? { ...v, isSelected } : v))
    );
  };
  
  const handleDetailChange = (videoId: string, field: 'category' | 'language' | 'region', value: string) => {
     setFetchedVideos(prev =>
      prev.map(v => (v.youtubeVideoId === videoId ? { ...v, [field]: value } : v))
    );
  }

  const videosReadyForImport = fetchedVideos.filter(v => v.isSelected && v.category);

  const handleImport = async () => {
    if (videosReadyForImport.length === 0) {
      toast({ variant: 'destructive', title: 'No videos ready for import', description: "Please select videos and assign a category to each." });
      return;
    }
     if (videosReadyForImport.length > 10) {
      toast({ variant: 'destructive', title: 'Too many videos selected', description: "You can import a maximum of 10 videos at a time." });
      return;
    }
    
    setIsSaving(true);
    const videosToSave: ImportedVideoSaveData[] = videosReadyForImport.map(v => ({
      ...v,
      contentCategory: v.category!,
      views: Math.floor(Math.random() * 100), // Placeholder
      watchTime: Math.floor(Math.random() * 100), // Placeholder
    }));

    try {
      await saveImportedVideos(videosToSave);
      toast({
        title: 'Import Successful!',
        description: `${videosReadyForImport.length} videos have been added to your library.`,
      });
      // Remove imported videos from the fetched list
      setFetchedVideos(prev => prev.filter(v => !videosReadyForImport.some(sv => sv.youtubeVideoId === v.youtubeVideoId)));
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
            <CardDescription>Choose up to 10 videos, assign a category, language, and region to each, then import them all at once.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex justify-end mb-6">
                <Button onClick={handleImport} disabled={isSaving || videosReadyForImport.length === 0}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                    Import {videosReadyForImport.length > 0 ? `(${videosReadyForImport.length})` : ''} Selected
                </Button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {fetchedVideos.map((video) => (
                <div key={video.youtubeVideoId} className="flex items-center gap-4 p-2 border rounded-lg flex-wrap">
                  <Checkbox
                    id={`video-${video.youtubeVideoId}`}
                    checked={video.isSelected}
                    onCheckedChange={(checked) => handleVideoSelection(video.youtubeVideoId, !!checked)}
                  />
                  <label htmlFor={`video-${video.youtubeVideoId}`} className="flex-grow flex items-center gap-4 cursor-pointer min-w-[200px]">
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
                  <div className="flex gap-2 flex-wrap">
                    <div className="w-40">
                        <Select onValueChange={(value) => handleDetailChange(video.youtubeVideoId, 'category', value)} value={video.category}>
                            <SelectTrigger>
                                <SelectValue placeholder="Category..." />
                            </SelectTrigger>
                            <SelectContent>
                                {categories?.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-40">
                        <Select onValueChange={(value) => handleDetailChange(video.youtubeVideoId, 'language', value)} value={video.language}>
                            <SelectTrigger>
                                <SelectValue placeholder="Language..." />
                            </SelectTrigger>
                            <SelectContent>
                                {LANGUAGES.map(lang => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-40">
                        <Select onValueChange={(value) => handleDetailChange(video.youtubeVideoId, 'region', value)} value={video.region}>
                            <SelectTrigger>
                                <SelectValue placeholder="Region..." />
                            </SelectTrigger>
                            <SelectContent>
                                {REGIONS.map(reg => <SelectItem key={reg} value={reg}>{reg}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
