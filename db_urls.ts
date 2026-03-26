import sql from './lib/db';
import fs from 'fs';
async function run() {
  try {
    const res = await sql`SELECT slug, page_type FROM pages WHERE status = 'published' ORDER BY updated_at DESC LIMIT 50`;
    const urls = res.map((r: any) => {
      if (r.slug.startsWith('locations/') || r.slug.startsWith('repair/')) return `http://localhost:3000/${r.slug}`;
      return `http://localhost:3000/diagnose/${r.slug}`;
    });
    fs.writeFileSync('urls.json', JSON.stringify(urls, null, 2));
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
