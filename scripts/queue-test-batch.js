const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function queueTestBatch() {
  console.log('🧪 Queueing 5-Tier Test Batch...');

  try {
    // Determine a system ID to use
    const sysResult = await sql`SELECT id FROM systems WHERE slug = 'residential-hvac' LIMIT 1`;
    const systemId = sysResult[0]?.id;

    if (!systemId) {
      console.log('❌ Could not find residential-hvac system ID');
      return;
    }

    // 1. Clear any pending queue items to keep the test clean
    await sql`DELETE FROM generation_queue WHERE status = 'queued'`;

    // 2. Queue 1 of each type
    const testItems = [
      {
        page_type: 'cluster',
        proposed_slug: 'ac-problems',
        proposed_title: 'AC Problems - Troubleshooting Cluster',
        system_id: systemId
      },
      {
        page_type: 'topic',
        proposed_slug: 'ac-not-cooling',
        proposed_title: 'AC Not Cooling - Causes, Diagnosis & Fixes',
        system_id: systemId
      },
      {
        page_type: 'cause',
        proposed_slug: 'why-does-capacitor-fail',
        proposed_title: 'Blown Start Capacitor - Symptoms & Root Cause Analysis',
        system_id: systemId
      },
      {
        page_type: 'repair',
        proposed_slug: 'how-to-replace-capacitor',
        proposed_title: 'How to Replace an AC Capacitor (Safe SOP)',
        system_id: systemId
      },
      {
        page_type: 'component',
        proposed_slug: 'ac-capacitor-anatomy',
        proposed_title: 'HVAC Capacitor - Specs, Testing & Failure Signs',
        system_id: systemId
      },
      {
        page_type: 'tool',
        proposed_slug: 'multimeter-hvac-guide',
        proposed_title: 'Using a Multimeter for HVAC Diagnostics',
        system_id: systemId
      }
    ];

    for (const item of testItems) {
      await sql`
        INSERT INTO generation_queue (page_type, proposed_slug, proposed_title, system_id, status)
        VALUES (${item.page_type}, ${item.proposed_slug}, ${item.proposed_title}, ${item.system_id}, 'queued')
        ON CONFLICT DO NOTHING
      `;
    }

    console.log('✅ Successfully queued 5 test pages.');
  } catch (err) {
    console.error('Fatal Error:', err);
  }
}

queueTestBatch();
