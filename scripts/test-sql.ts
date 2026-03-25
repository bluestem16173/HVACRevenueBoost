import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import sql from "../lib/db";

async function run() {
  const rows = await sql`SELECT city FROM pages WHERE slug='ac-not-cooling'`;
  console.log("CITY DATA:", rows);
  process.exit(0);
}
run();
