import { NextRequest, NextResponse } from 'next/request';
import { syncYouTubeChannels } from '../../../actions/sync-channels-flow';

/**
 * This route is called by a cron job to automatically sync all channels.
 * It now supports a CRON_SECRET for security when triggered externally.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If a secret is configured, validate the bearer token
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('Unauthorized cron trigger attempt.');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await syncYouTubeChannels();
    console.log('Auto-sync all channels cron job completed.', result);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Auto-sync all channels cron job failed:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
