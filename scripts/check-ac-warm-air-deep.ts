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
  const c = row?.content_json;
  
  if (c) {
    if (typeof c === 'string') {
        console.log("content_json is a string!");
    } else {
        console.log("diagnostic_flow is array?", Array.isArray(c.diagnostic_flow));
        console.log("diagnostic_flow:", JSON.stringify(c.diagnostic_flow, null, 2));
        console.log("decision_tree:", JSON.stringify(c.decision_tree, null, 2));
    }
  } else {
    console.log("No content_json");
  }
}
run().catch(console.error);
