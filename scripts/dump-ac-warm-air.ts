import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import fs from "fs";
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
    fs.writeFileSync("diagnose-warm-air.json", JSON.stringify(c, null, 2));
    console.log("Wrote diagnose-warm-air.json");
  } else {
    console.log("No content_json");
  }
}
run().catch(console.error);
