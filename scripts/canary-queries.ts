import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import sql from '../lib/db';

async function run() {
  console.log('\n--- 1. Causes under a failure mode ---');
  // Note: we'll just pull the first failure mode inserted for HVAC to be safe, 
  // since the LLM might have named the slug slightly different than 'hvac-compressor-activation-failure'.
  // We'll search by the exact slug 'hvac-compressor-activation-failure' first.
  const res1 = await sql`
    SELECT fm.name AS failure_mode, c.name AS cause
    FROM diagnostic_failure_modes fm
    JOIN diagnostic_causes c ON c.failure_mode_id = fm.id
    WHERE fm.slug = 'hvac-compressor-activation-failure'
    ORDER BY c.name
  `;
  if (res1.length > 0) {
    console.table(res1);
  } else {
    // Fallback if the name was capitalized differently
    const res1b = await sql`
      SELECT fm.name AS failure_mode, c.name AS cause
      FROM diagnostic_failure_modes fm
      JOIN diagnostic_causes c ON c.failure_mode_id = fm.id
      ORDER BY fm.name, c.name LIMIT 10
    `;
    console.table(res1b);
  }

  console.log('\n--- 2. Repairs for a cause ---');
  const res2 = await sql`
    SELECT c.name AS cause, r.name AS repair
    FROM diagnostic_causes c
    JOIN diagnostic_cause_repairs cr ON cr.cause_id = c.id
    JOIN diagnostic_repairs r ON r.id = cr.repair_id
    ORDER BY r.name LIMIT 10
  `;
  console.table(res2);

  console.log('\n--- 3. Failure modes for a page ---');
  const res3 = await sql`
    SELECT p.slug, fm.name, pfm.position
    FROM diagnostic_pages p
    JOIN diagnostic_page_failure_modes pfm ON pfm.page_id = p.id
    JOIN diagnostic_failure_modes fm ON fm.id = pfm.failure_mode_id
    WHERE p.slug = 'ac-blowing-warm-air'
    ORDER BY pfm.position
  `;
  console.table(res3);

  console.log('\n--- 4. Orphan detection (Causes w/o repairs) ---');
  const res4 = await sql`
    SELECT c.id, c.name
    FROM diagnostic_causes c
    LEFT JOIN diagnostic_cause_repairs cr ON cr.cause_id = c.id
    WHERE cr.cause_id IS NULL
  `;
  console.table(res4);

  console.log('\n--- 5. Orphan detection (Modes w/o causes) ---');
  const res5 = await sql`
    SELECT fm.id, fm.name
    FROM diagnostic_failure_modes fm
    LEFT JOIN diagnostic_causes c ON c.failure_mode_id = fm.id
    WHERE c.id IS NULL
  `;
  console.table(res5);
  
  process.exit(0);
}
run();
