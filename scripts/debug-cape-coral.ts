import sql from "../lib/db";

async function run() {
  const res = await sql`SELECT slug, status FROM pages WHERE slug ILIKE '%cape-coral%' OR slug ILIKE '%orlando%'`;
  console.log("DB RAW SLUGS:");
  res.forEach(r => console.log(`'${r.slug}'`, r.status));
  process.exit(0);
}
run();
