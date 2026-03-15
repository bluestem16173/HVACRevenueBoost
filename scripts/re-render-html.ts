import { neon } from '@neondatabase/serverless';
import { renderToHtml } from '../lib/ai-generator';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function reRenderPages() {
  console.log('Fetching pages with AI JSON content...');
  // Only target the specific page we are testing or all pages
  const pages = await sql`
    SELECT id, slug, content_json FROM pages 
    WHERE content_json IS NOT NULL
  `;
  
  console.log(`Found ${pages.length} pages to re-render.`);
  
  for (const page of pages) {
    if (page.content_json && typeof page.content_json === 'object') {
      try {
        const newHtml = renderToHtml(page.content_json);
        
        await sql`
          UPDATE pages 
          SET 
            content_json = jsonb_set(
              content_json::jsonb, 
              '{html_content}', 
              to_jsonb(${newHtml}::text)
            )
          WHERE id = ${page.id}
        `;
        console.log(`✅ Successfully re-rendered layout for slug: ${page.slug}`);
      } catch (e: any) {
        console.error(`❌ Error rendering slug ${page.slug}:`, e.message);
      }
    }
  }
  
  console.log('Done rendering all pages to apply the new DecisionGrid styles.');
}

reRenderPages().catch(console.error);
