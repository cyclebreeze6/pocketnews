import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { videos, channels } from '@/lib/data';
import { EngagementAnalysis } from '@/components/admin/engagement-analysis';
import { Eye, PlayCircle, Users } from 'lucide-react';

const totalViews = videos.reduce((acc, video) => acc + video.views, 0);
const totalWatchTime = videos.reduce((acc, video) => acc + video.watchTime, 0);
const totalVideos = videos.length;

const channelViews = channels.map(channel => {
    const views = channel.videoIds.reduce((acc, videoId) => {
        const video = videos.find(v => v.id === videoId);
        return acc + (video ? video.views : 0);
    }, 0);
    return { name: channel.name, views };
});

const engagementData = videos.map(v => ({
    name: v.title.substring(0, 15) + '...',
    views: v.views,
    watchTime: v.watchTime,
})).slice(0, 5);

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Intl.NumberFormat('en-US', { notation: 'compact' }).format(totalViews)}</div>
            <p className="text-xs text-muted-foreground">Across all videos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Watch Time (Hours)</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Intl.NumberFormat('en-US', { notation: 'compact' }).format(totalWatchTime)}</div>
             <p className="text-xs text-muted-foreground">Total engagement duration</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVideos}</div>
             <p className="text-xs text-muted-foreground">Uploaded on the platform</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Views by Channel</CardTitle>
            <CardDescription>A summary of total views for each channel.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={channelViews}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${Intl.NumberFormat('en-US', { notation: 'compact' }).format(value as number)}`} />
                <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))'}} />
                <Legend />
                <Bar dataKey="views" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Engagement AI Analysis</CardTitle>
            <CardDescription>Use AI to analyze video performance.</CardDescription>
          </CardHeader>
          <CardContent>
            <EngagementAnalysis />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 5 Video Performance</CardTitle>
          <CardDescription>Views vs. Watch Time for the most recent videos.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="hsl(var(--chart-1))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${Intl.NumberFormat('en-US', { notation: 'compact' }).format(value as number)}`} />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${Intl.NumberFormat('en-US', { notation: 'compact' }).format(value as number)}`} />
              <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))'}} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="views" stroke="hsl(var(--chart-1))" />
              <Line yAxisId="right" type="monotone" dataKey="watchTime" stroke="hsl(var(--chart-2))" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
