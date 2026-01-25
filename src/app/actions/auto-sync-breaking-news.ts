
'use server';

import { autoSyncBreakingNewsFlow } from '../../ai/flows/auto-sync-breaking-news-flow';
import type { AutoSyncResult } from '../../ai/flows/auto-sync-breaking-news-flow';

export async function runAutoSyncBreakingNews(): Promise<AutoSyncResult> {
  return autoSyncBreakingNewsFlow();
}
