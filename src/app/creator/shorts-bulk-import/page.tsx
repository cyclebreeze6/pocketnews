'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Checkbox } from '../../../components/ui/checkbox';
import { useToast } from '../../../hooks/use-toast';
import { Loader2, DownloadCloud, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { fetchNewShortsForBulkImport, saveImportedShorts } from '../../actions/bulk-import-shorts-actions';
import type { NewShortForImport, ImportedShortSaveData } from '../../actions/bulk-import-shorts-actions';
import { useUser } from '../../../firebase';

interface ShortToImport extends NewShortForImport {
  isSelected?: boolean;
}

export default function CreatorShortsBulkImportPage() {
  const { user } = useUser();
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchedShorts, setFetchedShorts] = useState<ShortToImport[]>([]);
  const { toast } = useToast();

  const handleFetchShorts = async () => {
    setIsFetching(true);
    setFetchedShorts([]);

    try {
      const results = await fetchNewShortsForBulkImport();
      setFetchedShorts(results.map(v => ({ ...v, isSelected: true }))); // Select all by default
      if (results.length === 0) {
        toast({ title: 'No new shorts found', description: 'All linked channels are up-to-date.' });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to fetch shorts',
        description: error.message,
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleShortSelection = (youtubeVideoId: string, isSelected: boolean) => {
    setFetchedShorts(prev =>
      prev.map(v => (v.youtubeVideoId === youtubeVideoId ? { ...v, isSelected } : v))
    );
  };

  const selectedShorts = fetchedShorts.filter(v => v.isSelected);

  const handleImport = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in.'});
        return;
    }
    if (selectedShorts.length === 0) {
      toast({ variant: 'destructive', title: 'No shorts selected for import.' });
      return;
    }
     if (selectedShorts.length > 25) {
      toast({ variant: 'destructive', title: 'Too many shorts selected', description: "You can import a maximum of 25 shorts at a time." });
      return;
    }
    
    setIsSaving(true);
    const shortsToSave: ImportedShortSaveData[] = selectedShorts.map(s => ({
      youtubeVideoId: s.youtubeVideoId,
      title: s.title,
      thumbnailUrl: s.thumbnailUrl,
      channelId: s.channelId,
      creatorId: user.uid,
    }));

    try {
      await saveImportedShorts(shortsToSave);
      toast({
        title: 'Import Successful!',
        description: `${selectedShorts.length} shorts have been added to your library.`,
      });
      // Remove imported shorts from the fetched list
      setFetchedShorts(prev => prev.filter(v => !selectedShorts.some(sv => sv.youtubeVideoId === v.youtubeVideoId)));
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Import Failed', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">Bulk Import Shorts</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Step 1: Fetch New Shorts</CardTitle>
          <CardDescription>Sync with all your linked YouTube channels to find shorts that haven't been imported yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleFetchShorts} disabled={isFetching}>
            {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DownloadCloud className="mr-2 h-4 w-4" />}
            {isFetching ? 'Fetching...' : 'Fetch New Shorts'}
          </Button>
        </CardContent>
      </Card>

      {fetchedShorts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Select and Import</CardTitle>
            <CardDescription>Choose the shorts you want to import, then click the import button.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex justify-end mb-6">
                <Button onClick={handleImport} disabled={isSaving || selectedShorts.length === 0}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                    Import {selectedShorts.length > 0 ? `(${selectedShorts.length})` : ''} Selected
                </Button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {fetchedShorts.map((short) => (
                <div key={short.youtubeVideoId} className="flex items-center gap-4 p-2 border rounded-lg flex-wrap">
                  <Checkbox
                    id={`short-${short.youtubeVideoId}`}
                    checked={short.isSelected}
                    onCheckedChange={(checked) => handleShortSelection(short.youtubeVideoId, !!checked)}
                  />
                  <label htmlFor={`short-${short.youtubeVideoId}`} className="flex-grow flex items-center gap-4 cursor-pointer min-w-[200px]">
                    <Image
                      src={short.thumbnailUrl}
                      alt={short.title}
                      width={68}
                      height={120}
                      className="rounded-md aspect-[9/16] object-cover"
                    />
                    <div className="flex-grow">
                      <p className="font-semibold line-clamp-2">{short.title}</p>
                      <p className="text-xs text-muted-foreground">{short.channelName}</p>
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
