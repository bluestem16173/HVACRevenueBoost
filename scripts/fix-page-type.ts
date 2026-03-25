import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import sql from "../lib/db";

async function run() {
  console.log("🛠️ Fixing legacy page_type mislabel...");
  const res = await sql`
    UPDATE pages 
    SET page_type = 'symptom' 
    WHERE slug = 'ac-not-cooling'
    RETURNING slug, page_type
  `;
  console.log("✅ Update complete:", res);
  process.exit(0);
}
run();
