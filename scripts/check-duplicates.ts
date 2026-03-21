import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function run() {
  const rows = await sql`
    SELECT id, slug, status, updated_at
    FROM pages
    WHERE slug = 'diagnose/ac-blowing-warm-air'
  `;
  console.log(`Found ${rows.length} rows for diagnose/ac-blowing-warm-air`);
  for (const row of rows) {
    console.log(`ID: ${row.id}, Status: ${row.status}, Updated: ${row.updated_at}`);
  }
}
run().catch(console.error);
