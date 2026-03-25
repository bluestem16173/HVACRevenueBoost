import sql from './lib/db';
async function run() {
  const res = await sql`SELECT content_json FROM pages WHERE slug = 'ac-blowing-warm-air'`;
  console.log(JSON.stringify(res[0].content_json, null, 2));
  process.exit(0);
}
run();
