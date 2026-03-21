import "dotenv/config";
import sql from '../lib/db';

/**
 * Enqueue Symptoms — populates generation_queue with symptom page_targets
 * that haven't been completed yet.
 * 
 * Usage: npx tsx scripts/enqueue-symptoms.ts [limit]
 * Default limit: 50
 */

const limit = parseInt(process.argv[2] || "50", 10);

async function enqueue() {
  console.log(`🗂️  Enqueueing up to ${limit} symptom pages...`);

  // Find symptom page_targets not already pending/processing in the queue
  const targets = await sql`
    SELECT pt.slug, pt.page_type
    FROM page_targets pt
    WHERE pt.page_type = 'symptom'
      AND pt.slug NOT IN (
        SELECT gq.proposed_slug 
        FROM generation_queue gq 
        WHERE gq.status IN ('pending', 'processing')
      )
    ORDER BY RANDOM()
    LIMIT ${limit}
  ` as { slug: string; page_type: string }[];

  if (!targets.length) {
    console.log("✅ Nothing to enqueue — all symptom targets are already queued or complete.");
    process.exit(0);
  }

  console.log(`📋 Found ${targets.length} targets to enqueue:`);
  targets.forEach(t => console.log(`  - ${t.slug}`));

  // Insert into generation_queue
  for (const t of targets) {
    const title = t.slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    await sql`
      INSERT INTO generation_queue (proposed_slug, proposed_title, page_type, status)
      VALUES (${t.slug}, ${title}, ${t.page_type}, 'pending')
      ON CONFLICT DO NOTHING
    `;
  }

  console.log(`✅ Enqueued ${targets.length} items. Run \`npm run worker\` to process them.`);
  process.exit(0);
}

enqueue().catch((err) => {
  console.error("❌ Enqueue error:", err);
  process.exit(1);
});
