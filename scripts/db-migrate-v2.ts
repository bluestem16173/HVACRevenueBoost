import "dotenv/config";
import sql from '../lib/db';

async function upgradeDB() {
  console.log("Upgrading Database schema...");

  // 1. Update pages table
  await sql`
    ALTER TABLE pages
    ADD COLUMN IF NOT EXISTS public_url TEXT,
    ADD COLUMN IF NOT EXISTS quality_score INT,
    ADD COLUMN IF NOT EXISTS schema_version TEXT,
    ADD COLUMN IF NOT EXISTS prompt_hash TEXT;
  `;
  console.log("✅ pages table upgraded");

  // 2. Ensure page_queue columns (assuming generation_queue is the actual table name)
  try {
    await sql`
      ALTER TABLE generation_queue
      ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS last_error TEXT,
      ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0;
    `;
    console.log("✅ generation_queue table upgraded");
  } catch (err: any) {
    console.log("⚠️ Could not alter generation_queue, testing if page_queue exists...", err.message);
    try {
      await sql`
        ALTER TABLE page_queue
        ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS last_error TEXT,
        ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0;
      `;
      console.log("✅ page_queue table upgraded");
    } catch (err2) {
      console.log("⚠️ Could not upgrade page_queue either.");
    }
  }

  // 3. Create system_logs (if not exists from previous run)
  await sql`
    CREATE TABLE IF NOT EXISTS system_logs (
      id SERIAL PRIMARY KEY,
      type TEXT,
      event_type TEXT,
      message TEXT,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  console.log("✅ system_logs table ensured");

  // 4. Create system_state
  await sql`
    CREATE TABLE IF NOT EXISTS system_state (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  
  // Set default auto mode to ON
  await sql`
    INSERT INTO system_state (key, value)
    VALUES ('auto_mode', 'ON')
    ON CONFLICT (key) DO NOTHING;
  `;
  console.log("✅ system_state table created");

  process.exit(0);
}

upgradeDB().catch(console.error);
