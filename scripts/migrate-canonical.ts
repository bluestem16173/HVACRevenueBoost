import "dotenv/config";
import sql from "../lib/db";

async function main() {
  try {
    console.log("Adding canonical_slug to pages...");
    await sql`ALTER TABLE pages ADD COLUMN IF NOT EXISTS canonical_slug VARCHAR(255);`;
    console.log("Migration OK");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
