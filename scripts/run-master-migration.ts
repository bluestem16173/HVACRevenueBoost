import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

/**
 * Run master platform migration + seed + verify.
 * Uses DATABASE_URL from .env.local
 *
 * npm run db:master-migrate
 * npm run db:master-seed
 * npm run db:master-verify
 */
import { readFileSync } from "fs";
import { join } from "path";
import { Client } from "pg";

async function runSql(client: Client, filePath: string) {
  const sql = readFileSync(filePath, "utf-8");
  await client.query(sql);
}

async function main() {
  const url = (process.env.DATABASE_URL || "").trim().replace(/^['"]|['"]$/g, "");
  if (!url) {
    console.error("DATABASE_URL not set. Check .env.local");
    process.exit(1);
  }

  const cmd = process.argv[2] || "migrate"; // migrate | seed | verify
  const root = join(process.cwd());

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    if (cmd === "migrate") {
      console.log("Running master migration...");
      await runSql(client, join(root, "db/migrations/001_master_platform_schema.sql"));
      console.log("✓ Migration complete");
    } else if (cmd === "seed") {
      console.log("Seeding HVAC graph...");
      await runSql(client, join(root, "scripts/seed_hvac_graph.sql"));
      console.log("✓ Seed complete");
    } else if (cmd === "verify") {
      console.log("Running verification queries...");
      await runSql(client, join(root, "scripts/verify_platform.sql"));
      console.log("✓ Verification complete");
    } else {
      console.error("Usage: npx tsx scripts/run-master-migration.ts [migrate|seed|verify]");
      process.exit(1);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
