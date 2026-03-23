import { generateTwoStagePage } from "../lib/content-engine/generator";
import sql from "../lib/db";

async function runWorker3() {
  const pendingAuthorityPages = [
    { slug: "how-furnaces-work", title: "How Furnaces Work" },
    { slug: "how-heat-pumps-work", title: "How Heat Pumps Work" },
    { slug: "how-hvac-works", title: "How HVAC Systems Work" }
  ];

  console.log(`🚀 Starting batch generation for ${pendingAuthorityPages.length} Authority Pages...`);

  for (const page of pendingAuthorityPages) {
    try {
      console.log(`\n⏳ Generating [${page.slug}]...`);
      const data = await generateTwoStagePage(page.title, {
        slug: page.slug,
        pageType: "authority",
        system: "HVAC"
      });

      console.log(`📦 Generation complete. Pushing [${page.slug}] to DB...`);

      await sql`
        INSERT INTO pages (slug, site, page_type, title, content_json, quality_status)
        VALUES (${page.slug}, 'hvac', 'authority', ${page.title}, ${JSON.stringify(data)}::jsonb, 'published')
      `;
      
      console.log(`✅ Successfully mounted: ${page.slug}`);
    } catch (err: any) {
      console.error(`❌ FAILED TO GENERATE ${page.slug}:`, err.message);
    }
  }
  
  console.log(`\n🏁 Worker Batch Complete.`);
  process.exit(0);
}

runWorker3();
