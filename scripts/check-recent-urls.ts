import 'dotenv/config';
import sql from '../lib/db';

async function check() {
  const pages = await sql`
    SELECT slug, page_type, city, status, updated_at
    FROM pages
    WHERE updated_at >= NOW() - INTERVAL '1 hour'
    ORDER BY updated_at DESC
    LIMIT 25;
  `;
  
  console.log(`Found ${pages.length} recently generated/updated pages in the last hour.`);
  
  const typeToRoute: Record<string, string> = {
    symptom: '/diagnose/',
    symptom_condition: '/conditions/',
    cause: '/cause/',
    repair: '/fix/',
    component: '/components/',
    system: '/system/',
    location_hub: '/repair/',
    diagnostic: '/diagnostic/'
  };

  const urls = pages.slice(0, 3).map(p => {
    let base = typeToRoute[p.page_type] || `/${p.page_type}/`;
    if (p.page_type === 'location_hub') {
      base += `${p.city}/`;
    }
    return `https://hvacrevenueboost.com${base}${p.slug}`;
  });

  require('fs').writeFileSync('urls.json', JSON.stringify({
    count: pages.length,
    urls: urls
  }, null, 2));
  console.log("Wrote to urls.json");
  process.exit(0);
}
check();
