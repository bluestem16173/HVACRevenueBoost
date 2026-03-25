import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import sql from "../lib/db";

async function main() {
  const slug = 'ac-not-cooling';
  const category = 'diagnose';
  const q1 = await sql`SELECT slug, page_type, city FROM pages WHERE slug = 'ac-not-cooling' AND page_type = 'diagnose' AND city IS NOT NULL`;
  const q2 = await sql`SELECT slug, page_type, city FROM pages WHERE slug = 'ac-not-cooling' AND page_type = 'diagnose' AND city = 'null'`;
  const q3 = await sql`SELECT slug, page_type, city FROM pages WHERE slug = 'ac-not-cooling' AND page_type = 'diagnose'`;
  console.log("Q1 (hardcoded):", q1.length);
  console.log("Q2 (slug param):", q2.length);
  console.log("Q3 (category param):", q3.length);
  process.exit(0);
}

main().catch(console.error);
