import { NextRequest, NextResponse } from 'next/server';
import { syncYouTubeChannels } from '../../../actions/sync-channels-flow';

/**
 * This route is called by a cron job to automatically sync all channels.
 * It requires a Bearer token in the Authorization header that matches the CRON_SECRET environment variable.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If a secret is configured, validate the bearer token
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('Unauthorized cron trigger attempt: Invalid or missing token.');
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
