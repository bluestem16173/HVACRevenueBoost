import sql from '../lib/db';
import fs from 'fs';
async function test() {
  const pages = await sql`SELECT slug, content_json FROM pages ORDER BY updated_at DESC LIMIT 1`;
  fs.writeFileSync('output-test.json', JSON.stringify({
    slug: pages[0].slug,
    mermaid: !!pages[0].content_json.mermaidGraph,
    flow: pages[0].content_json.diagnosticFlow
  }, null, 2));
  process.exit(0);
}
test();
