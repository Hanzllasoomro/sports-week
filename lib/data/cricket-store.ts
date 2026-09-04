import fs from 'fs';
import path from 'path';
import { createServiceClient } from '@/lib/supabase/server';
import type { CricketMatchDetails } from '@/types';

const STORE_FILE = path.join(process.cwd(), 'lib', 'data', 'cricket-cache.json');

function readLocalStore(): Record<string, CricketMatchDetails> {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch {
    // ignore
  }
  return {};
}

function writeLocalStore(data: Record<string, CricketMatchDetails>) {
  try {
    const dir = path.dirname(STORE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

/**
 * Persist cricket details into Supabase (and robust fallback storage)
 */
export async function persistCricketDetails(
  fixtureId: string,
  details: CricketMatchDetails
): Promise<void> {
  // Always update local cache first
  const cache = readLocalStore();
  cache[fixtureId] = details;
  writeLocalStore(cache);

  try {
    const supabase = await createServiceClient();

    // 1. Try updating direct column in fixtures table
    const { error: colErr } = await supabase
      .from('fixtures')
      .update({ cricket_details: details } as any)
      .eq('id', fixtureId);

    // If column exists, we are done!
    if (!colErr) return;

    // 2. If fixtures.cricket_details does not exist yet in Supabase schema,
    // persist inside the standings table breakdown JSONB as a reliable DB fallback!
    const { data: anyStanding } = await supabase.from('standings').select('batch_id, breakdown').limit(1).single();
    if (anyStanding) {
      const currentBreakdown = anyStanding.breakdown || {};
      const cricketStore = currentBreakdown._cricket_live_store || {};
      cricketStore[fixtureId] = details;
      await supabase
        .from('standings')
        .update({ breakdown: { ...currentBreakdown, _cricket_live_store: cricketStore } })
        .eq('batch_id', anyStanding.batch_id);
    }
  } catch (err) {
    console.error('[persistCricketDetails fallback]', err);
  }
}

/**
 * Retrieve saved cricket details for a fixture
 */
export async function retrieveCricketDetails(fixtureId: string): Promise<CricketMatchDetails | null> {
  // 1. Check local cache
  const cache = readLocalStore();
  if (cache[fixtureId]) {
    return cache[fixtureId];
  }

  // 2. Check Supabase standings fallback
  try {
    const supabase = await createServiceClient();
    const { data: anyStanding } = await supabase.from('standings').select('breakdown').limit(1).single();
    if (anyStanding?.breakdown?._cricket_live_store?.[fixtureId]) {
      const details = anyStanding.breakdown._cricket_live_store[fixtureId];
      // update local cache
      cache[fixtureId] = details;
      writeLocalStore(cache);
      return details;
    }
  } catch {
    // ignore
  }

  return null;
}
