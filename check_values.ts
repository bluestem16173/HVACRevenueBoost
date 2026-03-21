import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const result = await sql`SELECT slug, content_json FROM pages ORDER BY updated_at DESC LIMIT 5`;
  const row = result[0];
  console.log("SLUG:", row?.slug);
  const data = row?.content_json || {};
  console.log("decision_tree:", JSON.stringify(data.decision_tree).slice(0, 100));
  console.log("diagnostic_flow:", JSON.stringify(data.diagnostic_flow).slice(0, 100));
  console.log("narrow_down:", JSON.stringify(data.narrow_down).slice(0, 100));
  console.log("diagnosticFlow:", JSON.stringify(data.diagnosticFlow).slice(0, 100));
  console.log("mermaid_graph:", JSON.stringify(data.mermaid_graph).slice(0, 100));
}
main().catch(console.error);
