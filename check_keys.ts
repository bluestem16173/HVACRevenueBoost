import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const result = await sql`SELECT slug, content_json FROM pages ORDER BY updated_at DESC LIMIT 1`;
  const row = result[0];
  console.log("SLUG:", row?.slug);
  const keys = Object.keys(row?.content_json || {});
  console.log("KEYS:", keys);
  console.log("HAS decision_tree:", keys.includes("decision_tree"));
  console.log("HAS diagnostic_flow:", keys.includes("diagnostic_flow"));
}
main().catch(console.error);
