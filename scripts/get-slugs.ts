import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import sql from "../lib/db";

async function main() {
  const result = await sql`SELECT title, slug, page_type FROM pages ORDER BY created_at DESC LIMIT 15`;
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch(console.dir);
