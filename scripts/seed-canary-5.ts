/**
 * Seed 5 canary symptom pages for validation.
 * Run: npx tsx scripts/seed-canary-5.ts
 * Then: npx tsx scripts/generation-worker.ts (processes with LOCKED prompt)
 */
import "dotenv/config";
import sql from "../lib/db";

const CANARY_SLUGS = [
  "ac-not-cooling",
  "ac-running-but-not-cold",
  "one-room-hotter-than-others",
  "heat-pump-not-heating",
  "rv-ac-not-cooling",
];

async function seed() {
  for (const slug of CANARY_SLUGS) {
    const title = slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    const exists = await sql`
      SELECT 1 FROM generation_queue
      WHERE proposed_slug = ${slug} AND status IN ('pending', 'processing')
      LIMIT 1
    `;
    if (exists.length > 0) {
      console.log("⏭️ Already queued:", slug);
      continue;
    }
    await sql`
      INSERT INTO generation_queue (page_type, proposed_slug, proposed_title, status)
      VALUES ('symptom', ${slug}, ${title}, 'pending')
    `;
    console.log("✅ Queued:", slug);
  }
  console.log("\n🏁 Canary batch ready (5 pages). Run: npx tsx scripts/generation-worker.ts");
}

seed().catch(console.error);
