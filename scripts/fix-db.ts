import sql from "../lib/db";
async function fix() {
  await sql`UPDATE pages SET city = NULL, schema_version = 'v5_master', page_type = 'symptom' WHERE slug = 'ac-leaking-water'`;
  console.log("Fixed DB city to NULL and schema version to v5_master for ac-leaking-water");
  process.exit(0);
}
fix();
