import sql from "../lib/db";

async function queueGoldStandard() {
  console.log("Fetching Gold Standard target pages...");
  
  const targets = await sql`
    SELECT slug, page_type
    FROM page_targets
    WHERE page_type IN ('symptom', 'location_hub')
    AND (
      slug ILIKE '%not-cooling%' OR
      slug ILIKE '%blowing-warm%' OR
      slug ILIKE '%not-working%' OR
      slug ILIKE '%no-air%' OR
      slug IN (
        'tampa',
        'phoenix',
        'miami',
        'dallas',
        'houston'
      )
    )
    LIMIT 100
  `;

  let queued = 0;
  for (const row of targets as any[]) {
    try {
      await sql`
        INSERT INTO generation_queue (page_type, proposed_slug, status, priority)
        VALUES (${row.page_type}, ${row.slug}, 'queued', 100)
        ON CONFLICT (proposed_slug) DO UPDATE 
        SET status = 'pending', priority = 100, regeneration_attempts = 0
      `;
      queued++;
    } catch (err: any) {
      console.error(`Failed to queue ${row.slug}: `, err.message);
    }
  }

  console.log(`Successfully queued ${queued} Gold Standard pages`);
  process.exit(0);
}

queueGoldStandard().catch(console.error);
