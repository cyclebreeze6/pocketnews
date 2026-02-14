
'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Checkbox } from '../../../components/ui/checkbox';
import { useToast } from '../../../hooks/use-toast';
import { Loader2, UploadCloud } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '../../../firebase';
import type { Channel } from '../../../lib/types';
import { collection } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '../../../components/ui/dialog';
import { importLatestVideoFromChannels } from '../../actions/bulk-import-actions';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';

export default function CreatorBulkImportPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{ importedCount: number; errors: string[] } | null>(null);

  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const { data: channels, isLoading: channelsLoading } = useCollection<Channel>(channelsQuery);

  const handleChannelSelection = (channelId: string, isSelected: boolean) => {
    setSelectedChannelIds(prev =>
      isSelected ? [...prev, channelId] : prev.filter(id => id !== channelId)
    );
  };
  
  const handleSelectAll = (isSelected: boolean) => {
      if (isSelected && channels) {
          setSelectedChannelIds(channels.map(c => c.id));
      } else {
          setSelectedChannelIds([]);
      }
  }

  const handleImport = async () => {
    if (selectedChannelIds.length === 0) {
      toast({ variant: 'destructive', title: 'No channels selected', description: "Please select at least one channel to import from." });
      return;
    }
    
    setIsSaving(true);
    setImportResult(null);

    try {
      const result = await importLatestVideoFromChannels(selectedChannelIds);
      setImportResult(result);
      
      toast({
        title: 'Import Complete!',
        description: `Successfully imported ${result.importedCount} new video(s).`,
      });

      if (result.errors.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Some imports failed',
          description: "Check the results section for more details.",
        })
      }

      setIsDialogOpen(false); // Close dialog on success
      setSelectedChannelIds([]); // Reset selection

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Import Failed', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const allSelected = channels ? selectedChannelIds.length === channels.length : false;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">Bulk Import</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Import Latest Videos</CardTitle>
          <CardDescription>Import the single most recent video from a selection of your channels.</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
               <Button>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Start Import
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Select Channels</DialogTitle>
                <DialogDescription>
                  Choose the channels you want to import the latest video from.
                </DialogDescription>
              </DialogHeader>
              
              {channelsLoading ? (
                  <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
              ) : (
                <>
                <div className="flex items-center space-x-2 border-b pb-2">
                    <Checkbox
                        id="select-all"
                        checked={allSelected}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    />
                    <label
                        htmlFor="select-all"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                       Select All
                    </label>
                </div>
                <ScrollArea className="h-64">
                    <div className="space-y-2 p-1">
                        {channels?.map(channel => (
                            <div key={channel.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={channel.id}
                                    checked={selectedChannelIds.includes(channel.id)}
                                    onCheckedChange={(checked) => handleChannelSelection(channel.id, !!checked)}
                                />
                                <label
                                    htmlFor={channel.id}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    {channel.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                </>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleImport} disabled={isSaving || selectedChannelIds.length === 0}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Import ({selectedChannelIds.length})
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
      
      {importResult && (
        <Card>
           <CardHeader>
            <CardTitle>Last Import Results</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Successfully imported <strong>{importResult.importedCount}</strong> new video(s).</p>
            {importResult.errors.length > 0 && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>Errors Encountered</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-2 text-xs">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
