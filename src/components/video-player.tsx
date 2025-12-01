'use client';

interface VideoPlayerProps {
  youtubeId: string;
}

export function VideoPlayer({ youtubeId }: VideoPlayerProps) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg shadow-xl" style={{ paddingTop: '56.25%' }}>
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>
    </div>
  );
}
