import { Client } from "pg";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = (process.env.DATABASE_URL || "").trim().replace(/^['"]|['"]$/g, "");
if (!url) {
  console.error("DATABASE_URL not set. Check .env.local");
  process.exit(1);
}

function splitStatements(sql: string): string[] {
  const out: string[] = [];
  let buf = "";
  let inBlock = false;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (!inBlock) {
      if (c === "$" && sql[i + 1] === "$") {
        inBlock = true;
        buf += c;
        i++;
        continue;
      }
      if (c === ";" && !buf.trim().endsWith("$$")) {
        const s = buf.trim();
        if (s && !s.startsWith("--")) out.push(s + ";");
        buf = "";
        continue;
      }
    } else {
      if (c === "$" && sql.slice(i, i + 2) === "$$") {
        buf += "$$";
        i++;
        inBlock = false;
        continue;
      }
    }
    buf += c;
  }
  const s = buf.trim();
  if (s && !s.startsWith("--")) out.push(s + (s.endsWith(";") ? "" : ";"));
  return out;
}

async function run() {
  const client = new Client({ connectionString: url });
  await client.connect();
  console.log("Connected to Neon DB.");

  try {
    const migrationFile = join(process.cwd(), "db", "migrations", "017_page_queue_completed_at.sql");

    if (!existsSync(migrationFile)) {
      console.log(`Skipping: Not found ${migrationFile}`);
      return;
    }

    console.log("\n📦 Running 017 Migration (page_queue.completed_at)...");
    let rawSql = readFileSync(migrationFile, "utf-8");
    rawSql = rawSql.replace(/^\s*BEGIN;\s*/i, "").replace(/\s*COMMIT;\s*$/i, "").replace(/^--[^\n]*\n/gm, "");

    const statements = splitStatements(rawSql);
    let applied = 0;

    for (const stmt of statements) {
      if (!stmt.trim()) continue;
      try {
        await client.query(stmt);
        applied++;
      } catch (e: any) {
        if (e?.code !== "42701" && e?.code !== "42P07" && !e?.message?.includes("already exists")) {
          console.warn("  [Skip]", e?.message?.slice(0, 120));
        } else {
          applied++;
        }
      }
    }
    console.log(`✅ Applied ${applied}/${statements.length} statements for 017_page_queue_completed_at.sql`);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await client.end();
    console.log("DB connection closed.");
  }
}

run();
