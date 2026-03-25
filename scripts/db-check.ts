import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import sql from "../lib/db";

async function run() {
  console.log("URL target:", process.env.DATABASE_URL?.split('@')[1]);
  const rows = await sql`SELECT slug, status, page_type, schema_version FROM pages WHERE slug = 'ac-not-cooling'`;
  console.log("DB RAW RESULTS:", rows);
  process.exit(0);
}
run();
