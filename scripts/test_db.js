require('dotenv').config();
const sql = require('./lib/db').default;
async function check() {
  try {
    const q = await sql`SELECT id, proposed_slug, page_type, status FROM generation_queue ORDER BY created_at ASC LIMIT 10`;
    console.log("TOP 10 ITEMS:", q);
    const counts = await sql`SELECT status, count(*) FROM generation_queue GROUP BY status`;
    console.log("COUNTS:", counts);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
check();
