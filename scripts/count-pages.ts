import sql from '../lib/db';
async function getCount() {
  try {
    const result = await sql`SELECT count(*) FROM pages WHERE status = 'published'`;
    console.log("Total published pages in DB:", result[0].count);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
getCount();
