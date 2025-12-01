import Link from 'next/link';
import Image from 'next/image';
import type { Video } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Link href={`/watch/${video.id}`} className="group">
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <CardContent className="p-0">
          <div className="relative aspect-video">
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint="video thumbnail"
            />
          </div>
          <div className="p-4">
            <h3 className="font-semibold line-clamp-2 font-headline">{video.title}</h3>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
               <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{Intl.NumberFormat('en-US', { notation: 'compact' }).format(video.views)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{format(new Date(video.createdAt), 'PP')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
