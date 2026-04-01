import "dotenv/config";
import sql from "../lib/db";

async function run() {
  try {
    const res = await sql`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ('pages', 'ai_usage', 'generation_queue') ORDER BY table_name, column_name`;
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
