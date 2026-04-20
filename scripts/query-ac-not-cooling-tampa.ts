import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import sql from "@/lib/db";

async function main() {
  const rows = await sql`
    SELECT slug, status
    FROM pages
    WHERE slug = 'hvac/ac-not-cooling/tampa-fl'
  `;
  console.log(rows);
}

main().catch(console.error);
