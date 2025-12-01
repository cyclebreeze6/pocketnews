'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { analyzeVideoEngagement, type AnalyzeVideoEngagementOutput } from '@/ai/flows/analyze-video-engagement';
import { videos } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '../ui/card';
import { Lightbulb, Sparkles } from 'lucide-react';

const formSchema = z.object({
  videoId: z.string().min(1, 'Please select a video.'),
  userDemographics: z.string().min(10, 'Please describe the user demographics.'),
});

export function EngagementAnalysis() {
  const [analysisResult, setAnalysisResult] = useState<AnalyzeVideoEngagementOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      videoId: '',
      userDemographics: 'Viewers aged 25-45, primarily in North America, interested in technology and finance.',
    },
  });

  const selectedVideoId = form.watch('videoId');
  const selectedVideo = videos.find(v => v.id === selectedVideoId);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedVideo) return;

    setIsLoading(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeVideoEngagement({
        videoViews: selectedVideo.views,
        watchTime: selectedVideo.watchTime,
        userDemographics: values.userDemographics,
        contentCategory: selectedVideo.contentCategory,
      });
      setAnalysisResult(result);
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="videoId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a video to analyze" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {videos.map(video => (
                      <SelectItem key={video.id} value={video.id}>
                        {video.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedVideo && (
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-semibold">Views:</span> {selectedVideo.views.toLocaleString()}</div>
                <div><span className="font-semibold">Watch Time (hrs):</span> {selectedVideo.watchTime.toLocaleString()}</div>
                <div className="col-span-2"><span className="font-semibold">Category:</span> {selectedVideo.contentCategory}</div>
            </div>
          )}

          <FormField
            control={form.control}
            name="userDemographics"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User Demographics</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g., age, gender, location, interests" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading || !selectedVideo}>
            {isLoading ? 'Analyzing...' : 'Analyze Engagement'}
            {!isLoading && <Sparkles className="ml-2 h-4 w-4" />}
          </Button>
        </form>
      </Form>

      {isLoading && <div className="text-center text-muted-foreground">AI is thinking...</div>}

      {analysisResult && (
        <div className="space-y-4 pt-4">
            <h3 className="font-bold text-lg flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-primary"/> Key Insights</h3>
            <Card>
                <CardContent className="p-4 text-sm">
                    {analysisResult.keyInsights}
                </CardContent>
            </Card>
            <h3 className="font-bold text-lg flex items-center"><Sparkles className="mr-2 h-5 w-5 text-primary"/> Recommendations</h3>
             <Card>
                <CardContent className="p-4 text-sm">
                   {analysisResult.recommendations}
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
