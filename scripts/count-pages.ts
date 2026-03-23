import sql from '../lib/db';
async function run() {
  const result = await sql`SELECT page_type, COUNT(*) as count FROM pages GROUP BY page_type UNION ALL SELECT 'TOTAL', COUNT(*) FROM pages`;
  console.log(result);
  process.exit(0);
}
run();
