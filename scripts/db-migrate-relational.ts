import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import sql from '../lib/db';

async function run() {
  console.log('🚀 Running V2 Relational Database Migration...');

  const dropV = async (...queries: (() => Promise<any>)[]) => {
    for (const q of queries) {
      try { await q() } catch (e) {}
    }
  };

  await dropV(
    () => sql`DROP VIEW IF EXISTS diagnostic_migration_failures CASCADE`,
    () => sql`DROP TABLE IF EXISTS diagnostic_migration_failures CASCADE`,
    () => sql`DROP VIEW IF EXISTS diagnostic_order_steps CASCADE`,
    () => sql`DROP TABLE IF EXISTS diagnostic_order_steps CASCADE`,
    () => sql`DROP VIEW IF EXISTS diagnostic_guided_diagnosis_modes CASCADE`,
    () => sql`DROP TABLE IF EXISTS diagnostic_guided_diagnosis_modes CASCADE`,
    () => sql`DROP VIEW IF EXISTS diagnostic_guided_diagnosis CASCADE`,
    () => sql`DROP TABLE IF EXISTS diagnostic_guided_diagnosis CASCADE`,
    () => sql`DROP VIEW IF EXISTS diagnostic_cause_repairs CASCADE`,
    () => sql`DROP TABLE IF EXISTS diagnostic_cause_repairs CASCADE`,
    () => sql`DROP VIEW IF EXISTS diagnostic_page_causes CASCADE`,
    () => sql`DROP TABLE IF EXISTS diagnostic_page_causes CASCADE`,
    () => sql`DROP VIEW IF EXISTS diagnostic_page_failure_modes CASCADE`,
    () => sql`DROP TABLE IF EXISTS diagnostic_page_failure_modes CASCADE`,
    () => sql`DROP VIEW IF EXISTS diagnostic_repairs CASCADE`,
    () => sql`DROP TABLE IF EXISTS diagnostic_repairs CASCADE`,
    () => sql`DROP VIEW IF EXISTS diagnostic_causes CASCADE`,
    () => sql`DROP TABLE IF EXISTS diagnostic_causes CASCADE`,
    () => sql`DROP VIEW IF EXISTS diagnostic_failure_modes CASCADE`,
    () => sql`DROP TABLE IF EXISTS diagnostic_failure_modes CASCADE`,
    () => sql`DROP VIEW IF EXISTS diagnostic_pages CASCADE`,
    () => sql`DROP TABLE IF EXISTS diagnostic_pages CASCADE`
  );

  // 1. diagnostic_pages
  await sql`
    CREATE TABLE IF NOT EXISTS diagnostic_pages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      symptom TEXT NOT NULL,
      system TEXT NOT NULL,
      fast_answer TEXT NOT NULL,
      mermaid_diagram TEXT NOT NULL,
      raw_json JSONB,
      migration_version INT NOT NULL DEFAULT 2,
      source_page_id TEXT NULL,
      source_table TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // 2. diagnostic_failure_modes
  await sql`
    CREATE TABLE IF NOT EXISTS diagnostic_failure_modes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      system TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (system, slug)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_diagnostic_failure_modes_system ON diagnostic_failure_modes(system)`;

  // 3. diagnostic_causes
  await sql`
    CREATE TABLE IF NOT EXISTS diagnostic_causes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      system TEXT NOT NULL,
      failure_mode_id UUID REFERENCES diagnostic_failure_modes(id) ON DELETE CASCADE,
      test TEXT NOT NULL,
      expected_result TEXT NOT NULL,
      severity TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (system, slug)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_diagnostic_causes_failure_mode_id ON diagnostic_causes(failure_mode_id)`;

  // 4. diagnostic_repairs
  await sql`
    CREATE TABLE IF NOT EXISTS diagnostic_repairs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      estimated_cost TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // 5. diagnostic_page_failure_modes
  await sql`
    CREATE TABLE IF NOT EXISTS diagnostic_page_failure_modes (
      page_id UUID REFERENCES diagnostic_pages(id) ON DELETE CASCADE,
      failure_mode_id UUID REFERENCES diagnostic_failure_modes(id) ON DELETE CASCADE,
      position INT NOT NULL,
      PRIMARY KEY (page_id, failure_mode_id),
      UNIQUE (page_id, position)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_diagnostic_page_failure_modes_page_id ON diagnostic_page_failure_modes(page_id)`;

  // 6. diagnostic_page_causes
  await sql`
    CREATE TABLE IF NOT EXISTS diagnostic_page_causes (
      page_id UUID REFERENCES diagnostic_pages(id) ON DELETE CASCADE,
      cause_id UUID REFERENCES diagnostic_causes(id) ON DELETE CASCADE,
      position INT NOT NULL,
      PRIMARY KEY (page_id, cause_id),
      UNIQUE (page_id, position)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_diagnostic_page_causes_page_id ON diagnostic_page_causes(page_id)`;

  // 7. diagnostic_cause_repairs
  await sql`
    CREATE TABLE IF NOT EXISTS diagnostic_cause_repairs (
      cause_id UUID REFERENCES diagnostic_causes(id) ON DELETE CASCADE,
      repair_id UUID REFERENCES diagnostic_repairs(id) ON DELETE CASCADE,
      position INT NOT NULL,
      PRIMARY KEY (cause_id, repair_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_diagnostic_cause_repairs_cause_id ON diagnostic_cause_repairs(cause_id)`;

  // 8. diagnostic_guided_diagnosis
  await sql`
    CREATE TABLE IF NOT EXISTS diagnostic_guided_diagnosis (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      page_id UUID REFERENCES diagnostic_pages(id) ON DELETE CASCADE,
      scenario TEXT NOT NULL,
      next_step TEXT NOT NULL,
      position INT NOT NULL,
      UNIQUE (page_id, position)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_diagnostic_guided_diagnosis_page_id ON diagnostic_guided_diagnosis(page_id)`;

  // 9. diagnostic_guided_diagnosis_modes
  await sql`
    CREATE TABLE IF NOT EXISTS diagnostic_guided_diagnosis_modes (
      guided_diagnosis_id UUID REFERENCES diagnostic_guided_diagnosis(id) ON DELETE CASCADE,
      failure_mode_id UUID REFERENCES diagnostic_failure_modes(id) ON DELETE CASCADE,
      PRIMARY KEY (guided_diagnosis_id, failure_mode_id)
    )
  `;

  // 10. diagnostic_order_steps
  await sql`
    CREATE TABLE IF NOT EXISTS diagnostic_order_steps (
      page_id UUID REFERENCES diagnostic_pages(id) ON DELETE CASCADE,
      step_text TEXT NOT NULL,
      position INT NOT NULL,
      UNIQUE (page_id, position)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_diagnostic_order_steps_page_id ON diagnostic_order_steps(page_id)`;

  // 11. diagnostic_migration_failures
  await sql`
    CREATE TABLE IF NOT EXISTS diagnostic_migration_failures (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_slug TEXT NOT NULL,
      source_page_id TEXT NULL,
      error_message TEXT NOT NULL,
      payload JSONB NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  console.log('✅ Relational schema V2 migrated successfully!');
  process.exit(0);
}

run().catch(e => {
  console.error("❌ Migration failed:", e);
  process.exit(1);
});
