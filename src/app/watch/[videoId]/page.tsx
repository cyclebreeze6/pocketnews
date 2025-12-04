

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This page now acts as a redirect handler.
// If a user lands here directly (e.g., from a refresh or a shared link),
// it will redirect them to the homepage. The homepage logic will then
// parse the URL to play the correct video if the path was /watch/[videoId].
export default function WatchPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to the homepage.
    // The homepage will handle the logic of playing the video from the URL.
    router.replace('/');
  }, [router]);

  // Render a loading state or nothing while the redirect is happening.
  return null; 
}
