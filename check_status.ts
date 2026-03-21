import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const result = await sql`SELECT slug, status FROM pages WHERE slug = 'diagnose/ac-not-reaching-set-point'`;
  console.log("DB RECORD:", result[0]);
}
main().catch(console.error);
