import sql from "../lib/db";

async function checkPages() {
  const res = await sql`SELECT slug, status FROM pages WHERE slug ILIKE '%ac%' ORDER BY updated_at DESC LIMIT 30`;
  console.log(res);
  process.exit(0);
}

checkPages();
