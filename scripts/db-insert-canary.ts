import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import sql from "../lib/db";

async function insertCanaries() {
  try {
    const raw = fs.readFileSync("canary-gold-standard-output.json", "utf-8");
    const pages = JSON.parse(raw);

    console.log(`Found ${pages.length} pages to insert.`);

    for (const page of pages) {
      const slug = page.slug?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `canary-${Date.now()}`;
      const pageType = page.pageType?.toLowerCase() || 'symptom';
      
      const contentJson = page;

      let finalSlug = slug;
      if (pageType === "location" && !slug.includes("location")) finalSlug = `locations/${slug}`;
      if (pageType === "repair" && !slug.includes("repair")) finalSlug = `repair/${slug}`;
      if (pageType === "system" && !slug.includes("system")) finalSlug = `systems/${slug}`;

      await sql`
        INSERT INTO pages (slug, title, page_type, status, content_json, updated_at)
        VALUES (
          ${finalSlug}, 
          ${page.title || `Canary ${pageType}`}, 
          ${pageType}, 
          'published', 
          ${JSON.stringify(contentJson)}::jsonb,
          NOW()
        )
        ON CONFLICT (slug) DO UPDATE SET 
          content_json = EXCLUDED.content_json,
          title = EXCLUDED.title,
          status = 'published',
          updated_at = NOW()
      `;

      console.log(`Inserted ${pageType} prototype at slug: ${finalSlug}`);
    }

    console.log("All prototype pages inserted successfully.");
    process.exit(0);
  } catch (err: any) {
    console.error("Failed to insert prototypes:", err.message);
    process.exit(1);
  }
}

insertCanaries();
