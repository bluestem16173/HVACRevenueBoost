import "dotenv/config";
import sql from "../lib/db";

async function run() {
  await sql`
    CREATE TABLE IF NOT EXISTS system_state (
      key VARCHAR(50) PRIMARY KEY,
      value VARCHAR(50)
    )
  `;
  console.log("Created system_state table");
  process.exit(0);
}

run();
