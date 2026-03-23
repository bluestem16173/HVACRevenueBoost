import { generateTwoStagePage } from "./content-engine/generator";
import sql from "./db";

async function run() {
  const slug = "ac-not-cooling-tampa";
  console.log(`Starting Generative Injection for: ${slug}`);

  try {
    const data = await generateTwoStagePage("AC Not Cooling in Tampa", {
      slug,
      pageType: "hybrid",
      system: "HVAC"
    });
    
    await sql`
      INSERT INTO pages (slug, site, page_type, title, content_json, quality_status)
      VALUES (${slug}, 'hvac', 'hybrid', 'AC Not Cooling in Tampa', ${JSON.stringify(data)}::jsonb, 'published')
    `;
    console.log(`SUCCESSFULLY SEEDED DB ROW: ${slug}`);
  } catch (err: any) {
    if (err?.message?.includes("duplicate key")) {
       console.log(`SUCCESSFULLY SEEDED DB ROW: ${slug} (Already Existed)`);
    } else {
       console.error("FATAL INCIDENT:", err);
    }
  }
  process.exit(0);
}

run();
