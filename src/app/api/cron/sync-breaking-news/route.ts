import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET() {
  console.log('Auto-sync cron job triggered, but is currently disabled. Skipping execution.');
  return NextResponse.json({ success: true, message: 'Auto-sync is disabled.' });
}
