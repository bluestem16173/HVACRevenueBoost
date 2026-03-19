const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const url = (process.env.DATABASE_URL || "").trim().replace(/^['"]|['"]$/g, "");
  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    const res = await client.query(`
      SELECT slug, page_type 
      FROM pages 
      WHERE status = 'published' 
      ORDER BY id DESC 
      LIMIT 10
    `);
    console.log("Latest published pages:");
    res.rows.forEach(r => console.log(r.slug, '-', r.page_type));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
