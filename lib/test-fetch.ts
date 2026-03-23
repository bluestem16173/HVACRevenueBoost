import sql from './db';

async function run() {
  try {
    const [row] = await sql`SELECT content_json FROM pages WHERE slug = 'ac-not-cooling-tampa'`;
    console.log("KEYS:", Object.keys(row?.content_json || {}));
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}

run();
