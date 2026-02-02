import { NextResponse } from 'next/server';
import { runAutoSyncBreakingNews } from '../../../actions/auto-sync-breaking-news';

export const dynamic = 'force-dynamic';

// This route is temporarily disabled as its underlying features are not active.
export async function GET() {
  console.log('Auto-sync cron job triggered, but the feature is currently disabled.');
  return NextResponse.json({ 
    success: true, 
    message: "Auto-sync feature is temporarily disabled.",
    newVideosAdded: 0,
    syncedChannels: 0,
  });
}
