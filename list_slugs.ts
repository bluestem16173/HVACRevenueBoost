import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const result = await sql`SELECT slug FROM pages ORDER BY updated_at DESC LIMIT 5`;
  console.log("RECENT SLUGS:", result.map(r => r.slug).join(", "));
}
main().catch(console.error);
