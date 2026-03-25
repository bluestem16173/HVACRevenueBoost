import * as dotenv from "dotenv";
dotenv.config();
import sql from "../lib/db";

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS ai_usage (
      id serial primary key,
      model varchar,
      cost numeric,
      tokens integer,
      created_at timestamp default now()
    );
  `;
  console.log("ai_usage table created/verified!");
}

main().catch(console.dir);
