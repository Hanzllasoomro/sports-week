import { NextResponse } from 'next/server';
import { getPlayers } from '@/lib/data/public';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const players = await getPlayers();
    return NextResponse.json(players);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}
