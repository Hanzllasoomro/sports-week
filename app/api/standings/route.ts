import { NextResponse } from 'next/server';
import { getStandings } from '@/lib/data/public';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const standings = await getStandings();
    return NextResponse.json(standings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch standings' }, { status: 500 });
  }
}
