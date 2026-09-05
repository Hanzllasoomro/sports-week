import { NextResponse } from 'next/server';
import { retrieveCricketDetails } from '@/lib/data/cricket-store';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  context: { params: Promise<{ fixtureId: string }> }
) {
  try {
    const { fixtureId } = await context.params;
    const details = await retrieveCricketDetails(fixtureId);
    return NextResponse.json(details ?? null, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch {
    return NextResponse.json(null, { status: 500 });
  }
}
