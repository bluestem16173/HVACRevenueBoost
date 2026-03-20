import "dotenv/config";
import sql from '../lib/db';

async function fixPages() {
  try { await sql`ALTER TABLE pages ADD COLUMN content_json JSONB`; } catch (e) { }
  try { await sql`ALTER TABLE pages ADD COLUMN status VARCHAR(50)`; } catch (e) { }
  try { await sql`ALTER TABLE pages ADD COLUMN updated_at TIMESTAMP`; } catch (e) { }
  console.log("Fixed pages table");
  process.exit(0);
}

fixPages().catch(console.error);

fixPages().catch(console.error);
