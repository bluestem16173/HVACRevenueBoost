import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const pages = await sql`SELECT slug FROM pages WHERE status = 'published' LIMIT 10`;
  console.log(pages);
}
main();
