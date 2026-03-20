import "dotenv/config";
import sql from '../lib/db';

async function fixTable() {
  try { await sql`ALTER TABLE generation_queue ADD COLUMN started_at TIMESTAMP`; } catch (e) { console.log("started_at might exist"); }
  try { await sql`ALTER TABLE generation_queue ADD COLUMN finished_at TIMESTAMP`; } catch (e) { console.log("finished_at might exist"); }
  try { await sql`ALTER TABLE generation_queue ADD COLUMN error_log TEXT`; } catch (e) { console.log("error_log might exist"); }
  console.log("Fixed generation_queue columns");
  process.exit(0);
}

fixTable().catch(console.error);
