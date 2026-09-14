import { NextRequest, NextResponse } from 'next/server';
import { syncAllChannelsAction } from '../../../actions/bulk-auto-import-actions';
import { adminSDK, isFirebaseAdminInitialized } from '../../../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const maxDuration = 540; // 9-minute max execution limit

/**
 * 20-MINUTE AUTOMATIC YOUTUBE VIDEO IMPORT CRON ROUTE
 * Automatically fetches the latest videos from active YouTube channels every 20 minutes.
 * Supports Vercel Cron, Google Cloud Scheduler/App Engine, and CRON_SECRET authorization.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get('secret');
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'Z5b6zdd8uwS9cpfBNuuI6/msR+nC7xurKw2VnhbAkZA=';

  const isVercelCron = request.headers.get('x-vercel-cron') !== null;
  const isInternalGoogleTrigger = 
    request.headers.get('x-appengine-cron') === 'true' || 
    request.headers.get('x-cloudscheduler') === 'true';

  const isAuthorized = isVercelCron || isInternalGoogleTrigger || (cronSecret && (
    authHeader === `Bearer ${cronSecret}` || 
    authHeader === cronSecret ||
    querySecret === cronSecret
  ));

  if (!isAuthorized) {
    console.error('[Auto-Import Cron] Unauthorized attempt to trigger auto-import.');
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('[Auto-Import Cron] Starting 20-minute auto-import run...');

  try {
    const startTime = Date.now();
    const result = await syncAllChannelsAction();
    const durationMs = Date.now() - startTime;

    // Record auto-import run status in Firestore metadata if Admin SDK is available
    if (isFirebaseAdminInitialized) {
      try {
        const firestore = adminSDK.firestore();
        await firestore.doc('metadata/auto_import_status').set({
          lastAutoImportAt: FieldValue.serverTimestamp(),
          nextScheduledAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          syncedChannels: result.synced,
          newVideosImported: result.count,
          durationMs,
          status: 'success',
          lastMessage: `Auto-imported ${result.count} new videos from ${result.synced} YouTube channels.`,
        }, { merge: true });
      } catch (metaErr: any) {
        console.warn('[Auto-Import Cron] Unable to log metadata status:', metaErr.message);
      }
    }

    console.log(`[Auto-Import Cron] Completed in ${durationMs}ms. Imported ${result.count} videos across ${result.synced} channels.`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      intervalMinutes: 30,
      message: `Successfully processed 30-min auto-import. Added ${result.count} new videos.`,
      stats: {
        newVideosImported: result.count,
        channelsSynced: result.synced,
        durationMs,
      }
    });
  } catch (error: any) {
    console.error('[Auto-Import Cron] Auto-import failed with error:', error.message);

    if (isFirebaseAdminInitialized) {
      try {
        const firestore = adminSDK.firestore();
        await firestore.doc('metadata/auto_import_status').set({
          lastAutoImportAt: FieldValue.serverTimestamp(),
          status: 'error',
          lastError: error.message,
        }, { merge: true });
      } catch (_) {}
    }

    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 });
  }
}
