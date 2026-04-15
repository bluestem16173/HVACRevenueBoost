/**
 * Seed **only** queue blueprints (draft rows) — no LLM, no HTML.
 *
 * Inserts up to 50 localized HVAC diagnostic jobs into `generation_queue`:
 * 10 symptom slugs × 5 Florida city segments (see `lib/seed-pipeline.ts`).
 *
 * Run: npx tsx scripts/seed-first-50-hvac-fl-diagnostics.ts
 * Dry list: SEED_DRY_RUN=1 npx tsx scripts/seed-first-50-hvac-fl-diagnostics.ts
 */
import "dotenv/config";
import sql from "../lib/db";
import {
  FIRST_50_HVAC_FL_DIAGNOSTIC_SEEDS,
  proposedTitleForSeed,
} from "../lib/seed-pipeline";

const PAGE_TYPE = "diagnostic";

async function hasPriorityColumn(): Promise<boolean> {
  try {
    const rows = await sql`
      SELECT 1 AS ok
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'generation_queue'
        AND column_name = 'priority'
      LIMIT 1
    `;
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

async function seedOne(
  row: (typeof FIRST_50_HVAC_FL_DIAGNOSTIC_SEEDS)[number],
  usePriority: boolean,
  dry: boolean
): Promise<"inserted" | "skipped" | "dry"> {
  const proposed_title = proposedTitleForSeed(row);
  const dup = await sql`
    SELECT id FROM generation_queue
    WHERE proposed_slug = ${row.proposedSlug}
      AND page_type = ${PAGE_TYPE}
      AND city IS NOT DISTINCT FROM ${row.citySlug}
    LIMIT 1
  `;
  if (dup.length) return "skipped";

  if (dry) {
    console.log("[dry-run]", row.proposedSlug, row.citySlug, proposed_title, "priority", row.priority);
    return "dry";
  }

  if (usePriority) {
    await sql`
      INSERT INTO generation_queue (
        proposed_slug,
        proposed_title,
        page_type,
        status,
        city,
        priority,
        updated_at
      ) VALUES (
        ${row.proposedSlug},
        ${proposed_title},
        ${PAGE_TYPE},
        'draft',
        ${row.citySlug},
        ${row.priority},
        NOW()
      )
    `;
  } else {
    await sql`
      INSERT INTO generation_queue (
        proposed_slug,
        proposed_title,
        page_type,
        status,
        city,
        updated_at
      ) VALUES (
        ${row.proposedSlug},
        ${proposed_title},
        ${PAGE_TYPE},
        'draft',
        ${row.citySlug},
        NOW()
      )
    `;
  }
  return "inserted";
}

async function main() {
  const dry = process.env.SEED_DRY_RUN === "1" || process.env.SEED_DRY_RUN === "true";
  const usePriority = await hasPriorityColumn();
  if (!usePriority) {
    console.warn("⚠️  `generation_queue.priority` not found — seeding without priority column.");
  }

  let inserted = 0;
  let skipped = 0;
  for (const row of FIRST_50_HVAC_FL_DIAGNOSTIC_SEEDS) {
    const r = await seedOne(row, usePriority, dry);
    if (r === "inserted") inserted++;
    else if (r === "skipped") skipped++;
  }

  console.log(
    dry
      ? `✅ Dry run complete (${FIRST_50_HVAC_FL_DIAGNOSTIC_SEEDS.length} targets).`
      : `✅ Seed complete: inserted=${inserted}, skipped_duplicates=${skipped}, total_manifest=${FIRST_50_HVAC_FL_DIAGNOSTIC_SEEDS.length}.`
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
