import { NextResponse } from 'next/server';
import { runAutoSyncBreakingNews } from '../../../actions/auto-sync-breaking-news';

export const dynamic = 'force-dynamic'; // Prevent caching

// This route can be called by a cron job service (like Google Cloud Scheduler)
export async function GET() {
  try {
    console.log('Auto-sync cron job triggered...');
    const result = await runAutoSyncBreakingNews();
    console.log('Auto-sync completed:', result);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error during auto-sync cron job:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
