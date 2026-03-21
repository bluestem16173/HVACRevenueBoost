import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const rows = await sql`
    SELECT slug, page_type, content_json
    FROM pages
    WHERE page_type = 'symptom' AND content_json IS NOT NULL
    LIMIT 1
  `;

  if (rows.length === 0) {
    console.log("No symptom rows found.");
    return;
  }

  const row = rows[0];
  const json = typeof row.content_json === "string" ? JSON.parse(row.content_json) : row.content_json;

  console.log("Slug:", row.slug);
  console.log("Keys in JSON:", Object.keys(json));
  console.log("Has mermaid_graph?", !!json.mermaid_graph);
  console.log("Has diagnostic_flow?", !!json.diagnostic_flow);
  console.log("Type of mermaid_graph:", typeof json.mermaid_graph);
  
  if (json.mermaid_graph) {
    console.log("Starts with:");
    console.log(json.mermaid_graph.slice(0, 50));
  } else {
    console.log("No mermaid_graph, maybe diagnostic_tree_mermaid?");
    console.log(!!json.diagnostic_tree_mermaid);
  }
}

main().catch(console.error);
