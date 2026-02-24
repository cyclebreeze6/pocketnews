import { NextResponse } from 'next/server';
import { syncYouTubeChannels } from '../../../actions/sync-channels-flow';

// This route is called by a cron job to automatically sync all channels.
export async function GET() {
  try {
    const result = await syncYouTubeChannels();
    console.log('Auto-sync all channels cron job completed.', result);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Auto-sync all channels cron job failed:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
