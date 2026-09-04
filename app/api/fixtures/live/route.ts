import { NextResponse } from 'next/server';
import { getLiveFixtures } from '@/lib/data/public';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const liveFixtures = await getLiveFixtures();
    return NextResponse.json(liveFixtures, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch live fixtures' }, { status: 500 });
  }
}
