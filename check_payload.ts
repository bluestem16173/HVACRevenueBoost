import sql from "./lib/db";
import fs from "fs";

async function main() {
  try {
    const pages = await sql`
      SELECT content_json
      FROM pages 
      WHERE slug = 'ac-short-cycling'
      LIMIT 1;
    `;
    fs.writeFileSync("payload_utf8.json", JSON.stringify(pages[0].content_json, null, 2), "utf8");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
main();
