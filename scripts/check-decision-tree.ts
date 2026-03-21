import "dotenv/config";
import sql from "../lib/db";

async function run() {
  const rows = await sql`SELECT slug, content_json FROM pages WHERE slug = 'ac-blowing-warm-air' AND content_json IS NOT NULL LIMIT 1` as any[];
  if (rows.length) {
    const json = typeof rows[0].content_json === 'string' ? JSON.parse(rows[0].content_json) : rows[0].content_json;
    console.log("FOUND SLUG:", rows[0].slug);
    console.log("Keys:", Object.keys(json));
    console.log("Has mermaid_graph:", typeof json.mermaid_graph !== 'undefined');
    console.log("Has decision_tree:", typeof json.decision_tree !== 'undefined');
    if (json.mermaid_graph) {
      console.log("mermaid_graph preview:", String(json.mermaid_graph).substring(0, 100));
    }
  } else {
    console.log("NO SYMPTOM ROWS FOUND");
  }
  process.exit(0);
}
run().catch(console.error);
