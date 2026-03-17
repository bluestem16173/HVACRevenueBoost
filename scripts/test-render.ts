import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import { renderToHtml } from '../lib/ai-generator';

const sql = neon(process.env.DATABASE_URL!);

async function extractAndRenderHtml() {
  try {
    const pages = await sql`
      SELECT slug, page_type, content_json 
      FROM pages 
      WHERE content_json IS NOT NULL 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    if (pages.length === 0) {
      console.log('No pages found with JSON content.');
      return;
    }
    
    const page = pages[0];
    console.log(`Extracting and Rendering HTML for: ${page.slug} (${page.page_type})`);
    
    const aiData = typeof page.content_json === 'string' ? JSON.parse(page.content_json) : page.content_json;
    const htmlOutput = renderToHtml(aiData);
    fs.writeFileSync('tmp-test.html', htmlOutput);
    console.log('Successfully wrote rendered HTML to tmp-test.html');
  } catch (err) {
    console.error('Error rendering HTML:', err);
  }
}

extractAndRenderHtml();
