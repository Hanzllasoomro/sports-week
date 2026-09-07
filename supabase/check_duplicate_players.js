const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function deepScan() {
  const { data: players, error } = await supabase
    .from('players')
    .select('id, name, roll_no, gender, batch_id, batches(code)')
    .order('name');

  if (error) {
    console.error('Error fetching players:', error);
    return;
  }

  console.log('=== TOTAL REGISTERED ATHLETES: ' + players.length + ' ===');

  const cleanStr = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanName = (s) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ');

  // 1. Check matching BOTH Name AND Roll Number
  const nameAndRollMap = new Map();
  for (const p of players) {
    const key = cleanName(p.name) + ':::' + cleanStr(p.roll_no);
    if (!nameAndRollMap.has(key)) nameAndRollMap.set(key, []);
    nameAndRollMap.get(key).push(p);
  }

  const nameAndRollDups = Array.from(nameAndRollMap.entries()).filter(([k, v]) => v.length > 1);

  // 2. Check matching Roll Number only
  const rollMap = new Map();
  for (const p of players) {
    const r = cleanStr(p.roll_no);
    if (r) {
      if (!rollMap.has(r)) rollMap.set(r, []);
      rollMap.get(r).push(p);
    }
  }
  const rollDups = Array.from(rollMap.entries()).filter(([k, v]) => v.length > 1);

  // 3. Check matching Name only
  const nameMap = new Map();
  for (const p of players) {
    const n = cleanName(p.name);
    if (n) {
      if (!nameMap.has(n)) nameMap.set(n, []);
      nameMap.get(n).push(p);
    }
  }
  const nameDups = Array.from(nameMap.entries()).filter(([k, v]) => v.length > 1);

  console.log('\n--- SCAN RESULTS ---');
  console.log('1. Duplicate matches (Name AND Roll Number):', nameAndRollDups.length);
  if (nameAndRollDups.length > 0) {
    nameAndRollDups.forEach(([key, list], idx) => {
      console.log(`  Match #${idx + 1}: ${list[0].name} (Roll: ${list[0].roll_no}) appears in ${list.length} records:`);
      list.forEach(p => console.log(`    - ID: ${p.id} | Batch: ${p.batches?.code} | Gender: ${p.gender}`));
    });
  } else {
    console.log('  ✓ No duplicate records found where Name and Roll Number both match.');
  }

  console.log('\n2. Duplicate matches (Roll Number only):', rollDups.length);
  if (rollDups.length > 0) {
    rollDups.forEach(([roll, list], idx) => {
      console.log(`  Match #${idx + 1}: Roll ${roll} shared by:`);
      list.forEach(p => console.log(`    - ${p.name} | Batch: ${p.batches?.code} | ID: ${p.id}`));
    });
  } else {
    console.log('  ✓ All roll numbers in the database are completely unique.');
  }

  console.log('\n3. Duplicate matches (Name only):', nameDups.length);
  if (nameDups.length > 0) {
    nameDups.forEach(([name, list], idx) => {
      console.log(`  Match #${idx + 1}: Name "${list[0].name}" shared by:`);
      list.forEach(p => console.log(`    - Roll: ${p.roll_no} | Batch: ${p.batches?.code} | ID: ${p.id}`));
    });
  } else {
    console.log('  ✓ All player names in the database are unique.');
  }
}

deepScan();
