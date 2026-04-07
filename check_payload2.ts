import sql from "./lib/db";

async function main() {
  try {
    const pages = await sql`
      SELECT slug, updated_at
      FROM pages 
      WHERE updated_at > NOW() - INTERVAL '30 minutes'
      ORDER BY updated_at DESC
      LIMIT 10;
    `;
    console.log("ACTUAL NEW PAGES:");
    pages.forEach(p => console.log(p.slug, p.updated_at));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
main();
