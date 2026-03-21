import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const rows = await sql`
    SELECT slug, content_json
    FROM pages
    WHERE page_type = 'symptom' AND content_json IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 10
  `;

  console.log(`Checking ${rows.length} recent symptom pages:`);
  
  for (const row of rows) {
    const json = typeof row.content_json === "string" ? JSON.parse(row.content_json) : row.content_json;
    const hasMermaid = !!json.diagnosticFlowMermaid || !!json.mermaid_graph || !!json.decision_tree;
    console.log(`- ${row.slug}: Has diagram? ${hasMermaid}`);
  }
}

main().catch(console.error);
