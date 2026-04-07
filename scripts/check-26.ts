import sql from "../lib/db";

const slugs = [
  "ac-not-cooling",
  "ac-running-but-not-cooling",
  "ac-blowing-warm-air",
  "ac-not-turning-on",
  "ac-short-cycling",
  "ac-not-reaching-set-temperature",
  "ac-losing-cooling-power",
  "ac-cooling-slowly",
  "ac-not-cooling-evenly",
  "ac-turns-on-then-off",
  "tampa-ac-not-cooling",
  "tampa-ac-running-but-not-cooling",
  "tampa-ac-leaking-water",
  "tampa-ac-not-turning-on",
  "orlando-ac-not-cooling",
  "orlando-ac-short-cycling",
  "orlando-ac-blowing-warm-air",
  "cape-coral-ac-not-cooling",
  "cape-coral-ac-leaking-water",
  "cape-coral-ac-drain-line-clogged",
  "fort-myers-ac-not-cooling",
  "fort-myers-ac-breaker-tripping",
  "fort-myers-ac-leaking-water",
  "naples-ac-not-cooling",
  "naples-ac-running-but-not-cooling",
  "naples-ac-not-turning-on"
];

async function run() {
  const res = await sql`SELECT slug FROM pages WHERE slug = ANY(${slugs})`;
  const existing = res.map(r => r.slug);
  
  console.log(`\n\n--- DIAGNOSTIC PAGE STATUS ---\n`);
  let missing = [];
  slugs.forEach(s => {
    if (existing.includes(s)) {
      console.log(`✅ ${s}`);
    } else {
      console.log(`❌ ${s}`);
      missing.push(s);
    }
  });
  
  console.log(`\nFound ${existing.length} / ${slugs.length}.`);
  process.exit(0);
}

run();
