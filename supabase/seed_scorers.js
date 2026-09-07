// ============================================================
// Seed Official Scorer Accounts into Supabase Auth & Admins Table
// ============================================================
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SCORERS = [
  { name: 'Sajid', email: 'sajid@muet.edu.pk', password: 'Scorer#Sajid2026' },
  { name: 'Abdullah', email: 'abdullah@muet.edu.pk', password: 'Scorer#Abdullah2026' },
  { name: 'Zaheer', email: 'zaheer@muet.edu.pk', password: 'Scorer#Zaheer2026' },
  { name: 'Aina', email: 'aina@muet.edu.pk', password: 'Scorer#Aina2026' },
  { name: 'Tayyaba', email: 'tayyaba@muet.edu.pk', password: 'Scorer#Tayyaba2026' },
];

async function seedScorers() {
  console.log('--- Seeding 5 Official Scorer Accounts ---');

  // Check existing auth users
  const { data: userList, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error('Failed to list Supabase Auth users:', listErr.message);
  }

  const existingUsers = userList?.users || [];

  for (const scorer of SCORERS) {
    let userId = null;
    const existing = existingUsers.find((u) => u.email?.toLowerCase() === scorer.email.toLowerCase());

    if (existing) {
      userId = existing.id;
      console.log(`[FOUND] ${scorer.name} (${scorer.email}) with ID: ${userId}. Updating credentials...`);
      const { error: updErr } = await supabase.auth.admin.updateUserById(userId, {
        password: scorer.password,
        user_metadata: { name: scorer.name, role: 'scorer' },
      });
      if (updErr) console.warn(`  Warning updating user ${scorer.email}:`, updErr.message);
    } else {
      console.log(`[CREATING] ${scorer.name} (${scorer.email})...`);
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: scorer.email,
        password: scorer.password,
        email_confirm: true,
        user_metadata: { name: scorer.name, role: 'scorer' },
      });

      if (createErr) {
        console.error(`  Error creating ${scorer.email}:`, createErr.message);
      } else if (newUser?.user) {
        userId = newUser.user.id;
        console.log(`  Created successfully with ID: ${userId}`);
      }
    }

    // Register or upsert in `admins` table
    if (userId) {
      const { error: adminErr } = await supabase
        .from('admins')
        .upsert({
          id: userId,
          name: scorer.name,
          role: 'scorer',
        });

      if (adminErr) {
        console.warn(`  Warning upserting admins row for ${scorer.name}:`, adminErr.message);
      } else {
        console.log(`  Registered in database admins table as role: 'scorer'.`);
      }
    }
  }

  console.log('--- Official Scorer Accounts Setup Complete ---');
}

seedScorers();
