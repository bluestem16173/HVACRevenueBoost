import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

/**
 * Run migration 010 (Schema completion and compatibility) on Neon.
 * Idempotent, non-destructive. Creates missing tables for workers, APIs, SEO.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';

function splitStatements(sql: string): string[] {
  const out: string[] = [];
  let buf = '';
  let inBlock = false;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (!inBlock) {
      if (c === '$' && sql[i + 1] === '$') {
        inBlock = true;
        buf += c;
        i++;
        continue;
      }
      if (c === ';' && !buf.trim().endsWith('$$')) {
        const s = buf.trim();
        if (s && !s.startsWith('--')) out.push(s + ';');
        buf = '';
        continue;
      }
    } else {
      if (c === '$' && sql.slice(i, i + 2) === '$$') {
        buf += '$$';
        i++;
        inBlock = false;
        continue;
      }
    }
    buf += c;
  }
  const s = buf.trim();
  if (s && !s.startsWith('--')) out.push(s + (s.endsWith(';') ? '' : ';'));
  return out;
}

async function run() {
  const url = (process.env.DATABASE_URL || '').trim().replace(/^['"]|['"]$/g, '');
  if (!url) {
    console.error('DATABASE_URL not set. Check .env.local');
    process.exit(1);
  }
  const sqlPath = join(process.cwd(), 'db', 'migrations', '010_schema_completion_and_compatibility.sql');
  let sql = readFileSync(sqlPath, 'utf-8');
  sql = sql.replace(/^\s*BEGIN;\s*/i, '').replace(/\s*COMMIT;\s*$/i, '');
  const stmts = splitStatements(sql);
  const client = new Client({ connectionString: url });
  await client.connect();
  let ok = 0;
  let skip = 0;
  try {
    for (const stmt of stmts) {
      try {
        await client.query(stmt);
        ok++;
      } catch (e: any) {
        if (e?.code === '42701' || e?.code === '42P07' || e?.message?.includes('already exists')) {
          skip++;
        } else if (e?.message?.includes('does not exist') || e?.code === '42703') {
          skip++;
        } else {
          console.warn('Skip:', stmt.slice(0, 70).replace(/\s+/g, ' ') + '...', '→', e.message?.slice(0, 80));
          skip++;
        }
      }
    }
    console.log(`✅ Migration 010: ${ok} applied, ${skip} skipped.`);
  } catch (e: any) {
    console.error('Migration failed:', e.message);
    throw e;
  } finally {
    await client.end();
  }
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
