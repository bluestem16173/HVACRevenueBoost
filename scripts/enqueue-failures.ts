import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import sql from '../lib/db';

async function run() {
  console.log('🔄 Enqueuing migration failures...');
  
  try {
    const res = await sql`
      INSERT INTO generation_queue (
        page_type, status, proposed_slug, priority
      )
      SELECT
        'diagnose', 'draft', source_slug, 100
      FROM diagnostic_migration_failures
      ON CONFLICT DO NOTHING
    `;
    console.log(`✅ Queued items successfully.`);
    process.exit(0);
  } catch (e: any) {
    if (e.message.includes("column \"priority\"")) {
      console.log('Fallback to no priority column...');
      await sql`
        INSERT INTO generation_queue (
          page_type, status, proposed_slug, system_id
        )
        SELECT
          'diagnose', 'draft', source_slug, 'hvac'
        FROM diagnostic_migration_failures
      `;
      console.log('✅ Queued items successfully (fallback).');
      process.exit(0);
    } else {
      console.error("❌ Failed to push to queue:", e);
      process.exit(1);
    }
  }
}

run();
