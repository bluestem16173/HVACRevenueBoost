const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function checkQueue() {
  const sql = neon(process.env.DATABASE_URL);
  
  await sql`UPDATE generation_queue SET status = 'draft' WHERE proposed_slug IN ('diagnose-ac-blowing-warm-air', 'why-does-capacitor-fail')`;

  const results = await sql`
    SELECT id, proposed_slug, status 
    FROM generation_queue 
    WHERE proposed_slug IN ('diagnose-ac-blowing-warm-air', 'why-does-capacitor-fail')
    ORDER BY id DESC LIMIT 5
  `;
  console.log(JSON.stringify(results, null, 2));
}
checkQueue();
