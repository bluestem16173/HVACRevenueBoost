import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import sql from '../lib/db';
import { validateV2 } from '../lib/validators/validate-v2';
import { migrateOnePage } from '../lib/content-engine/relational-upsert';

async function recordFailure(slug: string, sourceId: string | null, errorMsg: string, payload: any) {
  try {
    await sql`
      INSERT INTO diagnostic_migration_failures (source_slug, source_page_id, error_message, payload)
      VALUES (${slug}, ${sourceId}, ${errorMsg}, ${payload ? JSON.stringify(payload) : null}::jsonb)
    `;
  } catch (e: any) {
    console.error(`Failed to record migration error for ${slug}: ${e.message}`);
  }
}

async function adaptV1ToV2(payload: any): Promise<any> {
    if (!payload.system) payload.system = "hvac";
    if (!payload.symptom) payload.symptom = payload.title || "Unknown Issue";
    if (payload.repair_matrix && !payload.repairs) payload.repairs = payload.repair_matrix;
    if (payload.top_causes && !payload.causes) payload.causes = payload.top_causes;

    if (payload.causes && Array.isArray(payload.causes)) {
        payload.causes = payload.causes.map((c: any) => {
            if (!c.test) c.test = "Physical diagnostic test required.";
            if (!c.expected_result) c.expected_result = "Test outcome confirms or rejects failure parameter.";
            if (!c.failure_mode) {
              if (payload.failure_modes && payload.failure_modes[0]) {
                 c.failure_mode = payload.failure_modes[0].name;
              } else {
                 c.failure_mode = "General Validation Required"; 
              }
            }
            return c;
        });
    }

    if (payload.repairs && Array.isArray(payload.repairs)) {
      payload.repairs = payload.repairs.map((r: any) => {
          if (!r.difficulty && r.cost_factor) r.difficulty = r.cost_factor;
          if (!r.difficulty) r.difficulty = "moderate";
          if (!r.estimated_cost) r.estimated_cost = "medium";
          if (!r.cause && payload.causes && payload.causes[0]) r.cause = payload.causes[0].name;
          return r;
      });
    }
    
    return payload;
}

async function run() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log(`🚀 Starting Relational Engine Migration... ${isDryRun ? '[DRY RUN MODE]' : ''}`);

  const pagesRes = await sql`
    SELECT slug, title, content_json, id
    FROM pages
    WHERE page_type IN ('diagnose', 'symptom')
  `;

  let processed = 0;
  let succeeded = 0;
  let skipped = 0;
  let failed = 0;
  let failedSlugs: { slug: string, reason: string }[] = [];

  for (const row of pagesRes) {
    let payload = row.content_json;
    if (!payload) {
      skipped++;
      continue;
    }

    processed++;

    try {
      // Light adapter for legacy structural paths before validating V2 graph strictly
      payload = await adaptV1ToV2(payload);
      validateV2(payload);
    } catch (ve: any) {
      failed++;
      failedSlugs.push({ slug: row.slug, reason: ve.message });
      if (!isDryRun) {
        await recordFailure(row.slug, row.id?.toString() || null, ve.message, payload);
      }
      continue;
    }

    if (isDryRun) {
      succeeded++;
      continue; // Dry run means don't hit the DB transaction logic
    }

    try {
      // For Neon HTTP serverless client, true interactive transactions aren't supported.
      // We process sequentially; junction drops at the start of migrateOnePage acts as partial rollback.
      await migrateOnePage(sql, row.id?.toString() || null, row.slug, payload);
      succeeded++;
      console.log(`✅ Migrated: ${row.slug}`);
    } catch (e: any) {
      failed++;
      failedSlugs.push({ slug: row.slug, reason: `DB Transaction Failed: ${e.message}` });
      await recordFailure(row.slug, row.id?.toString() || null, e.message, payload);
    }
  }

  console.log('\n--- Migration Summary ---');
  console.log(`Total Pages Inspected: ${pagesRes.length}`);
  console.log(`Processed: ${processed}`);
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Failed:    ${failed}`);
  console.log(`Skipped:   ${skipped}`);

  if (failed > 0) {
    console.log('\n--- First 10 Failures ---');
    failedSlugs.slice(0, 10).forEach(f => {
      console.log(`[${f.slug}] -> ${f.reason}`);
    });
  }

  process.exit(failed > 0 && !isDryRun ? 1 : 0);
}

run().catch(e => {
  console.error("Fatal Migration Error:", e);
  process.exit(1);
});
