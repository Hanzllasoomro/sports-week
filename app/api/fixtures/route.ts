import { NextResponse } from 'next/server';
import { getFixtures } from '@/lib/data/public';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const fixtures = await getFixtures();
    return NextResponse.json(fixtures);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fixtures' }, { status: 500 });
  }
}
