import { NextRequest, NextResponse } from 'next/server';
import { getChannelsForSync } from '../../../actions/get-channels-for-sync';
import { fetchChannelShorts } from '../../../../ai/flows/youtube-channel-shorts-flow';
import { adminSDK, isFirebaseAdminInitialized } from '../../../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const maxDuration = 540;

/**
 * Automated cron job to sync Shorts from active channels.
 * Deduplicates against recent shorts and commits in high-performance batches.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!isFirebaseAdminInitialized) {
    return NextResponse.json({ success: false, message: 'Admin SDK not ready' });
  }

  try {
    const { channelsToSync } = await getChannelsForSync({ onlyAutoSync: true });
    const db = adminSDK.firestore();
    
    // Check existing shorts (limit to last 500 for high-speed deduplication)
    const existingShortsSnap = await db.collection('shorts')
        .orderBy('createdAt', 'desc')
        .limit(500)
        .get();
    const existingIds = new Set(existingShortsSnap.docs.map(doc => doc.data().youtubeVideoId));
    
    let addedCount = 0;
    
    // Process a random subset of channels per run to stay well within timeout limits
    // while ensuring all channels eventually get refreshed.
    const sampleSize = 20;
    const sample = channelsToSync.sort(() => 0.5 - Math.random()).slice(0, sampleSize);

    for (const channel of sample) {
        if (!channel.youtubeChannelUrl) continue;
        try {
            // Fetch 2 most recent shorts per channel to keep feed fresh
            const shorts = await fetchChannelShorts({ channelUrl: channel.youtubeChannelUrl, maxResults: 2 });
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
            console.warn(`Shorts cron failed for ${channel.name}: ${e.message}`);
        }
    }

    return NextResponse.json({ 
        success: true, 
        message: `Shorts sync completed. Added ${addedCount} new shorts from sample of ${sample.length} channels.` 
    });
  } catch (error: any) {
    console.error('Shorts Cron Critical Failure:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
