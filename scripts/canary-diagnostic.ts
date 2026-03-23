import { generateTwoStagePage } from '../lib/content-engine/generator';
import sql from '../lib/db';

async function run() {
  const slug = 'boiler-not-firing';
  console.log(`Starting Generative Injection for: ${slug}`);

  try {
    const data = await generateTwoStagePage('Boiler Not Firing', {
      slug,
      pageType: 'symptom',
      system: 'HVAC'
    });

    console.log("LLM Complete. Pushing to DB.", JSON.stringify(data, null, 2));

    await sql`DELETE FROM pages WHERE slug = ${slug} AND page_type = 'symptom'`;

    await sql`
      INSERT INTO pages (slug, site, page_type, title, content_json, status, city)
      VALUES (${slug}, 'hvac', 'symptom', 'Boiler Not Firing', ${data as any}, 'published', NULL)
    `;

    console.log(`✅ Success: ${slug} mounted directly to DB`);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Failed generative run:", error.message);
    } else {
      console.error("Failed generative run:", error);
    }
  } finally {
    process.exit(0);
  }
}

run();
