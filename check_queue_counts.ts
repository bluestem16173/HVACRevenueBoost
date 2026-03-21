import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const allCounts = await sql`SELECT status, COUNT(*) FROM generation_queue GROUP BY status`;
  console.log("Queue status counts:", allCounts);
}
main().catch(console.error);
