import sql from './lib/db';
async function run() {
  try {
    const res = await sql`SELECT slug FROM pages WHERE status = 'published' AND page_type != 'diagnostic' ORDER BY updated_at DESC LIMIT 10`;
    const slugs = res.map(r => r.slug);
    console.log(JSON.stringify(slugs, null, 2));
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
