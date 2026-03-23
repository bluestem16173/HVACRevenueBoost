import { generateTwoStagePage } from './lib/content-engine/generator';
import sql from './lib/db';

async function r() {
  try {
    const d = await generateTwoStagePage('AC Not Cooling in Tampa', {
      slug: 'ac-not-cooling-tampa',
      pageType: 'hybrid',
      system: 'HVAC'
    });
    
    await sql`
      INSERT INTO pages(slug, site, page_type, title, content_json, quality_status)
      VALUES ('ac-not-cooling-tampa', 'hvac', 'hybrid', 'AC Not Cooling in Tampa', ${d as any}, 'published')
    `;
    console.log('OK - SUCCESS');
  } catch (e: any) {
    console.log('ERRMSG:', e.message);
  }
  process.exit(0);
}
r();
