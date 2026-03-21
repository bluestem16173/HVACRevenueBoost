import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const result24h = await sql`SELECT COUNT(*) FROM pages WHERE updated_at >= NOW() - INTERVAL '24 hours'`;
  const result12h = await sql`SELECT COUNT(*) FROM pages WHERE updated_at >= NOW() - INTERVAL '12 hours'`;
  
  console.log(`Pages updated in the last 24 hours: ${result24h[0].count}`);
  console.log(`Pages updated in the last 12 hours: ${result12h[0].count}`);
  
  const statusResult12h = await sql`SELECT status, COUNT(*) FROM pages WHERE updated_at >= NOW() - INTERVAL '12 hours' GROUP BY status`;
  console.log(`Status breakdown for last 12 hours:`, statusResult12h);

  const statusResult24h = await sql`SELECT status, COUNT(*) FROM pages WHERE updated_at >= NOW() - INTERVAL '24 hours' GROUP BY status`;
  console.log(`Status breakdown for last 24 hours:`, statusResult24h);
}
main().catch(console.error);
