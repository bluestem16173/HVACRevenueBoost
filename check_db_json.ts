import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const result = await sql`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE column_name = 'json' OR data_type = 'jsonb'
      AND table_schema = 'public'
    ORDER BY table_name;
  `;
  fs.writeFileSync("out_json_columns.json", JSON.stringify(result, null, 2));
}

main().catch(console.error);
