import 'dotenv/config';
import sql from '../lib/db';
import * as fs from 'fs';

async function checkPages() {
  try {
    const pages = await sql`
      SELECT slug, page_type, status, content_json
      FROM pages
      WHERE updated_at >= NOW() - INTERVAL '15 minutes'
      ORDER BY updated_at DESC
      LIMIT 20;
    `;
    
    const results = [];
    
    for (const page of pages as any[]) {
      const content = page.content_json?.content || page.content_json;
      const has_hero = !!content?.hero?.problemStatement || !!content?.hero?.headline;
      const has_flow = Array.isArray(content?.diagnosticFlow) && content.diagnosticFlow.length > 0;
      
      results.push({
        status: page.status,
        slug: page.slug,
        type: page.page_type,
        has_hero,
        has_flow,
        keys: (!has_hero || !has_flow) ? Object.keys(content || {}) : undefined
      });
    }
    
    fs.writeFileSync('hero-flow-results.json', JSON.stringify(results, null, 2));
    console.log("Wrote results to hero-flow-results.json");
    process.exit(0);
  } catch (err) {
    console.error('Error fetching pages:', err);
    process.exit(1);
  }
}
checkPages();
