
import { NextResponse } from 'next/server';
import { runAutoSyncBreakingNewsFlow } from '../../../../ai/flows/auto-sync-breaking-news-flow';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET() {
  try {
    const result = await runAutoSyncBreakingNewsFlow();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error running scheduled "Breaking News" sync flow:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
