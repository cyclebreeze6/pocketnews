
'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { useCollection, useFirebase, useMemoFirebase } from '../../../firebase';
import { collection } from 'firebase/firestore';
import type { Channel } from '../../../lib/types';
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { importLatestVideoFromChannels } from '../../actions/bulk-import-actions';
import { Checkbox } from '../../../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';

export default function CreatorSyncPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const { data: channels, isLoading: channelsLoading } = useCollection<Channel>(channelsQuery);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [results, setResults] = useState<{ importedCount: number; errors: string[] } | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.length === (channels?.length || 0)) {
      setSelectedIds([]);
    } else {
      setSelectedIds(channels?.map(c => c.id) || []);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkSync = async () => {
    if (selectedIds.length === 0) return;

    setIsSyncing(true);
    setResults(null);
    try {
      const res = await importLatestVideoFromChannels(selectedIds);
      setResults(res);
      toast({
        title: 'Sync Complete',
        description: `Imported ${res.importedCount} new videos to Breaking News.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: error.message,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Bulk Channel Sync</h1>
          <p className="text-muted-foreground">Select channels to fetch the latest news videos using RSS (API-free).</p>
        </div>
        <Button 
          onClick={handleBulkSync} 
          disabled={isSyncing || selectedIds.length === 0}
          size="lg"
        >
          {isSyncing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5" />}
          Sync {selectedIds.length} Selected Channels
        </Button>
      </div>

      {results && (
        <Card className={results.importedCount > 0 ? "border-green-500/50 bg-green-500/5" : "border-yellow-500/50 bg-yellow-500/5"}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              {results.importedCount > 0 ? (
                <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
              ) : (
                <AlertCircle className="h-6 w-6 text-yellow-500 shrink-0" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">Sync Results</p>
                <p className="text-sm text-muted-foreground">
                  Found and added **{results.importedCount}** new videos to your Breaking News feed.
                </p>
                {results.errors.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {results.errors.map((err, i) => (
                      <li key={i} className="text-xs text-destructive">• {err}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sources</CardTitle>
          <CardDescription>Only channels with a YouTube URL can be synced.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={channels?.length ? selectedIds.length === channels.length : false}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channelsLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : channels?.map((channel) => (
                <TableRow key={channel.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(channel.id)}
                      onCheckedChange={() => toggleSelect(channel.id)}
                      disabled={!channel.youtubeChannelUrl}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={channel.logoUrl} />
                        <AvatarFallback>{channel.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{channel.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {channel.youtubeChannelUrl ? (
                      <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full">Ready</span>
                    ) : (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">No URL</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
