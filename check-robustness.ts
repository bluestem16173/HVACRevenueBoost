import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("No DATABASE_URL");
  const sql = neon(process.env.DATABASE_URL);

  const stats = await sql`
    WITH recent_causes AS (
      SELECT 
        slug,
        content_json
      FROM pages 
      WHERE page_type = 'cause' 
        AND created_at >= CURRENT_DATE
    )
    SELECT 
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE content_json::text LIKE '%"systemMechanics"%') as with_mechanics,
      COUNT(*) FILTER (WHERE content_json::text LIKE '%"technicalDeepDive"%') as with_deep_dive,
      COUNT(*) FILTER (WHERE slug = 'fallback') as fallback_count,
      AVG(LENGTH(content_json::text))::int as avg_json_length
    FROM recent_causes;
  `;

  console.log(`\n\n--- CAUSE PAGE HEALTH CHECK ---`);
  console.log(`Total Generated Today: ${stats[0].total_count}`);
  console.log(`Passed Stage 2 (Has Mechanics): ${stats[0].with_mechanics}`);
  console.log(`Passed Stage 2 (Has Deep Dive): ${stats[0].with_deep_dive}`);
  console.log(`Fallback Failures: ${stats[0].fallback_count}`);
  console.log(`Average Payload Size: ${stats[0].avg_json_length} characters`);
  console.log(`-------------------------------\n\n`);
  process.exit(0);
}

main().catch(console.error);
