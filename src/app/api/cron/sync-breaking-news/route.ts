import { NextResponse } from 'next/server';
import { runAutoSyncBreakingNews } from '../../../actions/auto-sync-breaking-news';

export const dynamic = 'force-dynamic';

// This route is called by a cron job to automatically sync breaking news.
export async function GET() {
  try {
    const result = await runAutoSyncBreakingNews();
    console.log('Auto-sync cron job completed.', result);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Auto-sync cron job failed:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
