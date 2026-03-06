'use server';

import { runAutoSync } from '../../ai/flows/auto-sync-breaking-news-flow';

export async function runAutoSyncBreakingNews() {
  return runAutoSync();
}
