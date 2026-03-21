import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function run() {
  const rows = await sql`
    SELECT slug, content_json
    FROM pages
    WHERE slug = 'diagnose/ac-blowing-warm-air'
  `;
  const row = rows[0];
  console.log("Slug:", row?.slug);
  console.log("Has diagnostic_flow:", !!row?.content_json?.diagnostic_flow);
  console.log("Has decision_tree:", !!row?.content_json?.decision_tree);
  console.log("Has diagnostic_tree_mermaid:", !!row?.content_json?.diagnostic_tree_mermaid);
  console.log("Has system_explanation:", !!row?.content_json?.system_explanation);
  
  if (row?.content_json?.decision_tree) {
     console.log("decision_tree keys:", Object.keys(row.content_json.decision_tree));
  }
}
run().catch(console.error);
