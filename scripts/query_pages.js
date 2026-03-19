const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const url = (process.env.DATABASE_URL || "").trim().replace(/^['"]|['"]$/g, "");
  
  const client = new Client({ 
    connectionString: url,
    ssl: { rejectUnauthorized: false } // Required for AWS/Neon connections from Node pg
  });
  
  await client.connect();

  try {
    const res = await client.query(`
      SELECT slug 
      FROM pages 
      WHERE status = 'published' 
      ORDER BY id DESC 
      LIMIT 3
    `);
    console.log("Here are the 3 pages:");
    res.rows.forEach(r => console.log('https://www.hvacrevenueboost.com/' + r.slug));
  } catch (err) {
    console.error("DB QUERY ERROR:", err);
  } finally {
    await client.end();
  }
}

run();
