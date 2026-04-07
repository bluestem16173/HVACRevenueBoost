import sql from "../lib/db";

async function checkPages() {
  const res = await sql`SELECT slug FROM pages WHERE page_type = 'diagnostic' AND status = 'published'`;
  console.log("TOTAL DIAGNOSTIC PAGES:", res.length);
  console.log("SLUGS:");
  res.forEach(r => console.log(r.slug));
  process.exit(0);
}

checkPages();
