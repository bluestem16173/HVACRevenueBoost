/**
 * Seed Tier 1 core money pages (conditions) into generation_queue.
 * Slug format: conditions/{seed} for SEO hierarchy + routing consistency.
 *
 * Run: npx tsx scripts/seed-tier1-conditions.ts
 * Then: npx tsx scripts/generation-worker.ts (processes pending jobs)
 */
import "dotenv/config";
import sql from "../lib/db";

const TIER_1_SEEDS = [
  "ac-not-cooling",
  "ac-blowing-warm-air",
  "ac-not-turning-on",
  "ac-freezing-up",
  "ac-making-noise",
  "ac-leaking-water",
  "ac-smells-bad",
  "thermostat-not-working",
  "hvac-system-not-turning-on",
  "furnace-not-working",
  "heater-blowing-cold-air",
  "heat-pump-not-working",
  "hvac-short-cycling",
  "ac-running-constantly",
  "hvac-high-energy-bill",
];

async function seed() {
  console.log("🎯 Seeding Tier 1 conditions pages...\n");

  for (const seed of TIER_1_SEEDS) {
    const slug = `conditions/${seed}`;
    const proposedTitle = seed.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    const exists = await sql`
      SELECT 1 FROM generation_queue
      WHERE proposed_slug = ${slug}
      LIMIT 1
    `;

    if (exists.length > 0) {
      console.log("⏭️  Already queued:", slug);
      continue;
    }

    await sql`
      INSERT INTO generation_queue (page_type, proposed_slug, proposed_title, status)
      VALUES ('condition', ${slug}, ${proposedTitle}, 'pending')
    `;

    console.log("✅ Queued:", slug);
  }

  console.log("\n🏁 Tier 1 seed complete. Run: npx tsx scripts/generation-worker.ts");
}

seed().catch(console.error);
