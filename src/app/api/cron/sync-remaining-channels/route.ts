import { NextRequest, NextResponse } from 'next/server';
import { syncChannelsStateful } from '../../../../ai/flows/sync-channels-flow';

export const maxDuration = 540;

/**
 * Group B Alias: Now points to the unified stateful sync engine.
 * This ensures that even if called separately, the system advances correctly.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get('secret');
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  const isInternalGoogleTrigger = request.headers.get('x-appengine-cron') === 'true';

  const isAuthorized = isInternalGoogleTrigger || (cronSecret && (
    authHeader === `Bearer ${cronSecret}` || 
    authHeader === cronSecret ||
    querySecret === cronSecret
  ));

  if (!isAuthorized) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Process next batch in the cursor loop
    const result = await syncChannelsStateful(50);
    return NextResponse.json({ 
      success: true, 
      group: 'Unified-Stateful',
      message: `Batch completed. Added ${result.newVideosAdded} items.` 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
