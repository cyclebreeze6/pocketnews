import { NextRequest, NextResponse } from 'next/server';
import { getChannelsForSync } from '../../../actions/get-channels-for-sync';
import { fetchChannelShorts } from '../../../../ai/flows/youtube-channel-shorts-flow';
import { adminSDK, isFirebaseAdminInitialized } from '../../../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const maxDuration = 540;

/**
 * Automated cron job to sync Shorts from active channels.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  const isAuthorized = cronSecret && (
    authHeader === `Bearer ${cronSecret}` || 
    authHeader === cronSecret
  );

  if (!isAuthorized) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!isFirebaseAdminInitialized) {
    return NextResponse.json({ success: false, message: 'Admin SDK not ready' });
  }

  console.log("[Sync] Starting Shorts auto-sync cron...");

  try {
    const { channelsToSync } = await getChannelsForSync({ onlyAutoSync: true });
    if (channelsToSync.length === 0) {
        return NextResponse.json({ success: true, message: 'No channels enabled for auto-sync.' });
    }

    const db = adminSDK.firestore();
    
    // Fetch recent short IDs to prevent duplicates (limit to 500 for speed)
    const existingShortsSnap = await db.collection('shorts')
        .orderBy('createdAt', 'desc')
        .limit(500)
        .get();
    const existingIds = new Set(existingShortsSnap.docs.map(doc => doc.data().youtubeVideoId));
    
    let addedCount = 0;
    // Process a random selection of channels each time to stay fresh without hitting limits
    const sampleSize = 15;
    const shuffled = [...channelsToSync].sort(() => Math.random() - 0.5);
    const sample = shuffled.slice(0, sampleSize);

    console.log(`[Sync] Scanning ${sample.length} random channels for new shorts...`);

    for (const channel of sample) {
        if (!channel.youtubeChannelUrl) continue;
        try {
            const shorts = await fetchChannelShorts({ channelUrl: channel.youtubeChannelUrl, maxResults: 3 });
            const newShorts = shorts.filter(s => !existingIds.has(s.youtubeVideoId));
            
            if (newShorts.length > 0) {
                const batch = db.batch();
                newShorts.forEach(short => {
                    const docRef = db.collection('shorts').doc();
                    batch.set(docRef, {
                        ...short,
                        id: docRef.id,
                        channelId: channel.id,
                        creatorId: 'system-auto-sync',
                        createdAt: FieldValue.serverTimestamp(),
                    });
                    addedCount++;
                });
                await batch.commit();
            }
        } catch (e: any) {
            console.warn(`[Sync] Shorts fetch failed for ${channel.name}: ${e.message}`);
        }
    }

    console.log(`[Sync] Shorts cron completed. Added ${addedCount} new items.`);

    return NextResponse.json({ 
        success: true, 
        message: `Shorts sync completed. Added ${addedCount} new shorts.` 
    });
  } catch (error: any) {
    console.error('[Sync] Shorts Cron Failure:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
