import sql from '../lib/db';
import * as fs from 'fs';
async function fetchRecent() {
  const causes = await sql`
    SELECT slug FROM pages
    WHERE slug LIKE 'causes/%'
    ORDER BY updated_at DESC
    LIMIT 20
  `;
  const text = causes.map(c => `http://localhost:3000/${c.slug}`).join('\n');
  fs.writeFileSync('urls-20.txt', text);
  process.exit(0);
}
fetchRecent();
