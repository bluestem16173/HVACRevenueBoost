import * as dotenv from "dotenv";
dotenv.config();
import sql from "../lib/db";

const PAGE_TYPES = [
  "symptom",
  "diagnostic",
  "cause",
  "repair",
  "component",
  "condition",
  "authority",
  "city"
];

async function main() {
  console.log("Seeding prototypes for generation...");
  const slugsToRegen: string[] = [];

  for (const pType of PAGE_TYPES) {
    try {
      // Find one published or draft page of this type
      const res = await sql`
        SELECT slug FROM pages 
        WHERE page_type = ${pType} 
        LIMIT 1
      `;
      if ((res as any[]).length > 0) {
        slugsToRegen.push((res as any[])[0].slug);
        console.log(`[${pType}] Found slug: ${(res as any[])[0].slug}`);
      } else {
        console.log(`[${pType}] No rows found!`);
      }
    } catch (e: any) {
      console.error(`Error fetching ${pType}:`, e.message);
    }
  }

  if (slugsToRegen.length > 0) {
    console.log(`\nRequeueing ${slugsToRegen.length} pages...`);
    // update them all
    for (const slug of slugsToRegen) {
      await sql`
        UPDATE pages 
        SET status = 'draft', quality_status = 'needs_regen', quality_score = NULL 
        WHERE slug = ${slug}
      `;
    }
    console.log("Pages requeued successfully. You can now run the worker.");
  }
}

main().catch(console.dir);
