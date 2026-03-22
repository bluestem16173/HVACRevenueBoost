import sql from '../lib/db';
async function run() {
  const pages = await sql`SELECT slug, status, quality_status FROM pages WHERE slug = 'diagnose/weird-hvac-smells'`;
  console.log('RESULTS:', pages);
  process.exit(0);
}
run();
