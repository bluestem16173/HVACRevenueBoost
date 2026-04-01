import "dotenv/config";
import sql from "../lib/db";

async function migrate() {
  console.log("🚀 Starting orchestrator telemetry updates...");

  try {
    await sql`
      ALTER TABLE orchestrator_runs
      ADD COLUMN IF NOT EXISTS requests_per_minute INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS tokens_per_minute INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS rate_limit_count INT DEFAULT 0;
    `;
    console.log("✅ Added metric columns to orchestrator_runs!");
  } catch (error) {
    console.error("❌ Migration Failed:", error);
    process.exit(1);
  }
}

migrate();
