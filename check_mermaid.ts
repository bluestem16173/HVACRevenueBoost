import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const result = await sql`SELECT content_json FROM pages WHERE slug = 'diagnose/ac-blowing-warm-air'`;
  const row = result[0];
  fs.writeFileSync("mermaid_dump.json", JSON.stringify(row?.content_json?.decision_tree || row?.content_json?.mermaid_graph || row?.content_json?.diagnosticFlowMermaid, null, 2));
}
main().catch(console.error);
