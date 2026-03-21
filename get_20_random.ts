import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const result = await sql`
    SELECT slug FROM pages 
    WHERE status = 'published' AND updated_at >= NOW() - INTERVAL '24 hours' 
    ORDER BY RANDOM() LIMIT 20
  `;
  let out = "--- START LIST ---\n";
  for (const row of result) {
    out += `http://localhost:3000/${row.slug}\n`;
  }
  out += "--- END LIST ---\n";
  fs.writeFileSync("rand_slugs_utf8.txt", out, "utf8");
}
main().catch(console.error);
