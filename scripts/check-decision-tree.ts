import "dotenv/config";
import sql from "../lib/db";

async function run() {
  // Check both slug formats
  for (const slug of ['diagnose/ac-not-cooling', 'conditions/ac-not-cooling', 'ac-not-cooling']) {
    const rows = await sql`SELECT slug, quality_score, status FROM pages WHERE slug = ${slug} LIMIT 1` as any[];
    if (rows.length) {
      const data = await sql`SELECT content_json FROM pages WHERE slug = ${slug} LIMIT 1` as any[];
      const json = data[0].content_json;
      console.log(`FOUND [${slug}]:`);
      console.log("  Keys:", Object.keys(json));
      console.log("  Has decision_tree:", !!json.decision_tree);
    } else {
      console.log(`NOT FOUND: ${slug}`);
    }
  }
  process.exit(0);
}

run().catch(console.error);
