import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as fs from "fs";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const result = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'pages'`;
  fs.writeFileSync("cols.txt", result.map(r => r.column_name).join("\n"));
}

main().catch(console.error);
