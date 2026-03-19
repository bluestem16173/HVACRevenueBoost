/**
 * Seed validation test batch: 2 repair, 1 symptom, 1 context
 * Run before: GENERATION_VALIDATION_MODE=true npx tsx scripts/generation-worker.ts
 */
import 'dotenv/config';
import sql from '../lib/db';

async function seed() {
  const batch = [
    { page_type: 'repair', proposed_slug: 'repair/phoenix/ac-not-turning-on', proposed_title: 'AC Not Turning On | Phoenix' },
    { page_type: 'repair', proposed_slug: 'repair/phoenix/furnace-not-heating', proposed_title: 'Furnace Not Heating | Phoenix' },
    { page_type: 'repair', proposed_slug: 'repair/houston/ac-blowing-warm-air', proposed_title: 'AC Blowing Warm Air | Houston' },
  ];

  for (const row of batch) {
    const exists = await sql`
      SELECT 1 FROM generation_queue
      WHERE proposed_slug = ${row.proposed_slug} AND status = 'pending'
      LIMIT 1
    `;
    if (exists.length > 0) {
      console.log('⏭️ Already queued:', row.proposed_slug);
      continue;
    }
    await sql`
      INSERT INTO generation_queue (page_type, proposed_slug, proposed_title, status)
      VALUES (${row.page_type}, ${row.proposed_slug}, ${row.proposed_title}, 'pending')
    `;
    console.log('✅ Queued:', row.page_type, row.proposed_slug);
  }
  console.log('🏁 Validation batch ready. Run: GENERATION_VALIDATION_MODE=true npx tsx scripts/generation-worker.ts');
}

seed().catch(console.error);
