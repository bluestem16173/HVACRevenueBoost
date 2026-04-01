import "dotenv/config";
import sql from "../lib/db";

async function migrate() {
  console.log("🚀 Starting generation_queue modification...");

  try {
    await sql`
      ALTER TABLE generation_queue
      ADD COLUMN IF NOT EXISTS orchestrator_options JSONB DEFAULT '{}'::jsonb;
    `;
    console.log("✅ Added orchestrator_options to generation_queue!");
  } catch (error) {
    console.error("❌ Migration Failed:", error);
    process.exit(1);
  }
}

migrate();
