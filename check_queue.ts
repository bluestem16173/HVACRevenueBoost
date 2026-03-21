import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const result = await sql`SELECT count(*) FROM generation_queue WHERE status = 'pending'`;
  console.log("PENDING COUNT:", result[0]?.count);
}
main().catch(console.error);
