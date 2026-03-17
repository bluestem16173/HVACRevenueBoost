import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';

const sql = neon(process.env.DATABASE_URL!);

async function run() {
  try {
    const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'symptoms'`;
    const rows = await sql`SELECT * FROM symptoms LIMIT 1`;
    fs.writeFileSync('schema.json', JSON.stringify({ columns: cols, firstRow: rows }, null, 2));
    console.log("Written to schema.json");
  } catch(e) {
    console.error(e);
  }
}
run();
