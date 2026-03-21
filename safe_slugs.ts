import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const result = await sql`SELECT slug FROM pages ORDER BY updated_at DESC LIMIT 5`;
  fs.writeFileSync("slugs_dump.json", JSON.stringify(result.map(r => r.slug), null, 2));
}
main().catch(console.error);
