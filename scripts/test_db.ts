import "dotenv/config";
import sql from '../lib/db';
import * as fs from 'fs';

async function checkRecentPages() {
  try {
    const recentCount = await sql`SELECT COUNT(*) FROM pages WHERE created_at > NOW() - INTERVAL '24 hours'`;
    const recentPages = await sql`SELECT slug, created_at FROM pages ORDER BY created_at DESC LIMIT 10`;
    
    fs.writeFileSync('recent_pages.json', JSON.stringify({
      count_last_24h: recentCount[0].count,
      recent_pages: recentPages
    }, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
checkRecentPages();
