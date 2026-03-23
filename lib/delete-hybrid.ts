import sql from "./db";

async function run() {
  try {
    await sql`DELETE FROM pages WHERE slug = 'ac-not-cooling-tampa'`;
    console.log("SUCCESSFULLY DELETED LEGACY ROW");
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

run();
