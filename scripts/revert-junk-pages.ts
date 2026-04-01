import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { execSync } from "child_process";

dotenv.config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("Cleaning Junk Pages...");
  try {
    await sql`
      UPDATE pages
      SET 
        content_json = NULL,
        status = 'draft',
        updated_at = NOW()
      WHERE updated_at > NOW() - INTERVAL '24 hours'
    `;
    console.log("✅ Reverted rows in pages table.");

    await sql`
      UPDATE generation_queue
      SET status = 'draft', page_id = NULL
      WHERE status IN ('published', 'completed') AND created_at >= NOW() - INTERVAL '24 hours'
    `;
    console.log("✅ Reset rows in generation_queue back to pending.");
  } catch (err) {
    console.error("DB Error:", err);
  }
}

main().catch(console.error);
