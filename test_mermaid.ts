import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const rows = await sql`
    SELECT slug, page_type, content_json
    FROM pages
    WHERE slug = 'ac-blowing-warm-air'
    LIMIT 1
  `;

  if (rows.length === 0) {
    console.log("No row found.");
    return;
  }

  const row = rows[0];
  const json = typeof row.content_json === "string" ? JSON.parse(row.content_json) : row.content_json;

  console.log("diagnosticFlowMermaid value:");
  console.log(json.diagnosticFlowMermaid);
}

main().catch(console.error);
