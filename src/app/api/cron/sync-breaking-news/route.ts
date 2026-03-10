import { NextRequest, NextResponse } from 'next/server';
import { runAutoSyncBreakingNews } from '../../../actions/auto-sync-breaking-news';
import { isFirebaseAdminInitialized } from '../../../../lib/firebase-admin';

export const maxDuration = 540; // 9 minutes to match apphosting.yaml

/**
 * This route is called by a cron job to automatically sync breaking news.
 * It requires a Bearer token in the Authorization header that matches the CRON_SECRET environment variable.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Validate the bearer token
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.error('Unauthorized breaking news cron trigger attempt: Invalid or missing token.');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await runAutoSyncBreakingNews();
    console.log('Auto-sync breaking news completed.', result);
    
    return NextResponse.json({ 
      success: true, 
      adminActive: isFirebaseAdminInitialized,
      message: `Breaking News sync completed. Added ${result.newVideosAdded} new breaking news items.`,
      ...result 
    });
  } catch (error: any) {
    console.error('Auto-sync breaking news cron job failed:', error);
    return NextResponse.json({ 
        success: false, 
        adminActive: isFirebaseAdminInitialized,
        message: error.message 
    }, { status: 500 });
  }
}
