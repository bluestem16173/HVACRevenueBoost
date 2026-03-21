import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import sql from './lib/db';

async function test() {
  const res = await sql`SELECT slug, content_json FROM pages WHERE slug = 'diagnose/rv-hvac'`;
  console.log('Result length:', res.length);
  if (res.length > 0) {
    console.log('Type of content_json:', typeof res[0].content_json);
    console.log('Is null?', res[0].content_json === null);
  }
  process.exit(0);
}
test();
