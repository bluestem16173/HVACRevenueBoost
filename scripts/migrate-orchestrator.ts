import "dotenv/config";
import sql from "../lib/db";

async function migrate() {
  console.log("🚀 Starting Orchestrator v1 DB Migration...");

  try {
    // RUNS TABLE
    console.log("Creating orchestrator_runs table...");
    await sql`
      CREATE TABLE IF NOT EXISTS orchestrator_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        status VARCHAR(50) NOT NULL,
        project VARCHAR(100),
        batch_size INT,
        max_cost DECIMAL,
        actual_cost DECIMAL DEFAULT 0,
        started_at TIMESTAMPTZ DEFAULT NOW(),
        ended_at TIMESTAMPTZ,
        error_message TEXT
      );
    `;

    // RUN STEPS
    console.log("Creating orchestrator_run_steps table...");
    await sql`
      CREATE TABLE IF NOT EXISTS orchestrator_run_steps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id UUID REFERENCES orchestrator_runs(id) ON DELETE CASCADE,
        step_name VARCHAR(100),
        status VARCHAR(50),
        message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // PAGES TABLE
    console.log("Creating orchestrator_run_pages table...");
    await sql`
      CREATE TABLE IF NOT EXISTS orchestrator_run_pages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id UUID REFERENCES orchestrator_runs(id) ON DELETE CASCADE,
        slug VARCHAR(255),
        url TEXT,
        status VARCHAR(50),
        error TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // AUDITS TABLE
    console.log("Creating orchestrator_page_audits table...");
    await sql`
      CREATE TABLE IF NOT EXISTS orchestrator_page_audits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id UUID REFERENCES orchestrator_runs(id) ON DELETE CASCADE,
        page_slug VARCHAR(255),
        structure_score INT DEFAULT 0,
        seo_score INT DEFAULT 0,
        graph_score INT DEFAULT 0,
        content_score INT DEFAULT 0,
        total_score INT GENERATED ALWAYS AS (structure_score + seo_score + graph_score + content_score) STORED,
        status_band VARCHAR(50),
        recommendations JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    console.log("✅ Migration Complete!");
  } catch (error) {
    console.error("❌ Migration Failed:", error);
    process.exit(1);
  }
}

migrate();
