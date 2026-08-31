'use server';

import { fetchTdtChannelsFromSource } from '../../lib/tdtchannels';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { IptvChannel } from '../../lib/types';

// Ensure Firebase Admin is initialized
function getAdminFirestore() {
  if (getApps().length === 0) {
    initializeApp();
  }
  return getFirestore(getApp());
}

export async function syncTdtChannelsAction() {
  try {
    const { tv, radio } = await fetchTdtChannelsFromSource();
    const allChannels = [...tv, ...radio];

    if (allChannels.length === 0) {
      return { success: false, count: 0, message: 'No channels returned from TDTChannels source.' };
    }

    const db = getAdminFirestore();
    const batchSize = 450; // Firestore limit is 500 per batch
    let importedCount = 0;

    for (let i = 0; i < allChannels.length; i += batchSize) {
      const chunk = allChannels.slice(i, i + batchSize);
      const batch = db.batch();

      for (const ch of chunk) {
        const docRef = db.collection('iptv_channels').doc(ch.id);
        const data: Record<string, any> = {
          id: ch.id,
          name: ch.name,
          logoUrl: ch.logoUrl,
          m3u8Url: ch.m3u8Url,
          epgId: ch.epgId || '',
          type: ch.type,
          category: ch.category,
          country: ch.country,
          web: ch.web || '',
          extraInfo: ch.extraInfo || [],
          updatedAt: new Date().toISOString(),
        };
        batch.set(docRef, data, { merge: true });
        importedCount++;
      }

      await batch.commit();
    }

    return {
      success: true,
      count: importedCount,
      tvCount: tv.length,
      radioCount: radio.length,
      message: `Successfully synced ${importedCount} IPTV channels (${tv.length} TV, ${radio.length} Radio).`,
    };
  } catch (error: any) {
    console.error('Error in syncTdtChannelsAction:', error);
    return {
      success: false,
      count: 0,
      message: error.message || 'Failed to sync TDTChannels.',
    };
  }
}
