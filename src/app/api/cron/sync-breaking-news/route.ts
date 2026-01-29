import { NextResponse } from 'next/server';
import { fetchNewYouTubeVideosFlow } from '../../../../ai/flows/sync-channels-flow';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET() {
  try {
    const result = await fetchNewYouTubeVideosFlow();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error running scheduled channel sync flow:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
