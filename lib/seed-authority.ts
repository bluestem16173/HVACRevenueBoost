import { generateTwoStagePage } from "./content-engine/generator";
import sql from "./db";

async function run() {
  const slug = "how-air-conditioners-work";
  console.log(`Starting Generative Injection for: ${slug}`);

  try {
    const data = await generateTwoStagePage("How Air Conditioners Work", {
      slug,
      pageType: "authority",
      system: "HVAC"
    });

    console.log("LLM Complete. Pushing to DB.");

    await sql`
      INSERT INTO pages (slug, site, page_type, title, content_json, quality_status)
      VALUES (${slug}, 'hvac', 'authority', 'How Air Conditioners Work', ${data as any}, 'published')
      ON CONFLICT (slug, site) DO UPDATE SET
        content_json = EXCLUDED.content_json,
        title = EXCLUDED.title,
        quality_status = EXCLUDED.quality_status;
    `;

    console.log(`✅ Success: ${slug} mounted directly to DB`);
  } catch (error) {
    console.error("Failed generative run:", error);
  } finally {
    process.exit(0);
  }
}

run();
