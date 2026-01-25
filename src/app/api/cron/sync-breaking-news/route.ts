import { NextResponse } from 'next/server';
import { autoSyncBreakingNewsFlow } from '../../../../ai/flows/auto-sync-breaking-news-flow';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET() {
  try {
    const result = await autoSyncBreakingNewsFlow();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error running auto-sync breaking news flow:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
