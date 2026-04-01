import "dotenv/config";
import sql from "../lib/db";

async function run() {
  try {
    const res = await sql`SELECT slug, page_type, schema_version, status, quality_status FROM pages WHERE slug = 'rv-ac-fan-running-but-no-cooling'`;
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
