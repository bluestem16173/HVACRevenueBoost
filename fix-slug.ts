import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import sql from './lib/db';

async function fix() {
  const result = await sql`UPDATE pages SET slug = 'diagnose/rv-hvac' WHERE slug = '/rv-hvac' RETURNING id`;
  console.log('Fixed slug for:', result);
  process.exit(0);
}
fix();
