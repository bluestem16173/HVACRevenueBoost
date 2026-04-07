import sql from "./lib/db";

async function main() {
  try {
    const pages = await sql`
      SELECT slug, schema_version 
      FROM pages 
      WHERE schema_version = 'hvac_authority_v3' 
      ORDER BY updated_at DESC 
      LIMIT 10;
    `;
    console.log("LATEST V3 PAGES:");
    pages.forEach(p => console.log(`http://localhost:3001/diagnose/${p.slug}`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
main();
