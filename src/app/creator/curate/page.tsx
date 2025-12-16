'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../hooks/use-toast';
import { Loader2, Search, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { searchYouTubeVideos } from '../../actions/youtube-search-flow';
import type { YouTubeVideoDetails } from '../../../ai/flows/youtube-search-flow';
import { useRouter } from 'next/navigation';

export default function CreatorCurationPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeVideoDetails[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) {
      toast({ variant: 'destructive', title: 'Please enter a search term.' });
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      const results = await searchYouTubeVideos({ query: searchQuery });
      setSearchResults(results);
      if (results.length === 0) {
        toast({ title: 'No results found', description: 'Try a different search term.' });
      }
    } catch (error: any) {
      console.error('An unexpected error occurred during search:', error);
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = (video: YouTubeVideoDetails) => {
    // Navigate to the 'new video' page and pass the YouTube URL and a redirect param
    const youtubeUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
    const redirectUrl = '/creator/curate';
    router.push(`/creator/videos/new?youtubeUrl=${encodeURIComponent(youtubeUrl)}&redirect=${encodeURIComponent(redirectUrl)}`);
  };


  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Curation by Search</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Search YouTube</CardTitle>
          <CardDescription>
            Find recent videos by topic, keyword, or tag and import them into your library.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-start gap-2">
            <Input
              placeholder="e.g., 'latest tech news'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow"
              disabled={isSearching}
            />
            <Button type="submit" disabled={isSearching || !searchQuery}>
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Search
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Search Results</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map((video) => (
                    <Card key={video.videoId} className="overflow-hidden">
                        <div className="relative aspect-video">
                            <Image
                                src={video.thumbnailUrl}
                                alt={video.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <CardContent className="p-4">
                            <h3 className="font-semibold line-clamp-2 leading-snug h-12">{video.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{video.channelTitle}</p>
                            <Button className="w-full mt-4" variant="outline" size="sm" onClick={() => handleImport(video)}>
                                <UploadCloud className="mr-2 h-4 w-4" />
                                Import Video
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}
