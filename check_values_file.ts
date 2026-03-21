import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const result = await sql`SELECT slug, content_json FROM pages ORDER BY updated_at DESC LIMIT 5`;
  const row = result[0];
  fs.writeFileSync("db_values_dump.json", JSON.stringify({
    slug: row?.slug,
    decision_tree: row?.content_json?.decision_tree,
    diagnostic_flow: row?.content_json?.diagnostic_flow,
    narrow_down: row?.content_json?.narrow_down,
    diagnosticFlow: row?.content_json?.diagnosticFlow,
    mermaid_graph: row?.content_json?.mermaid_graph,
  }, null, 2));
}
main().catch(console.error);
