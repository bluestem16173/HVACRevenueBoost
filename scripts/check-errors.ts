import "dotenv/config";
import sql from "../lib/db";

async function run() {
  try {
    const res = await sql`SELECT proposed_slug, last_error FROM generation_queue WHERE status IN ('draft', 'pending') OR status = 'failed' ORDER BY created_at DESC LIMIT 5`;
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
