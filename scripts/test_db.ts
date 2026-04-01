import "dotenv/config";
import sql from '../lib/db';
import * as fs from 'fs';

async function run() {
  try {
    const rawData = fs.readFileSync('payload_out.json', 'utf8');
    const jsonData = JSON.parse(rawData);
    
    console.log("Updating ac-blowing-warm-air row with payload_out.json...");
    await sql`
      UPDATE pages 
      SET content_json = ${JSON.stringify(jsonData)}::jsonb,
          schema_version = 'v5_master'
      WHERE slug = 'ac-blowing-warm-air'
    `;
    console.log("Successfully overloaded DB with V2 Gold Standard JSON!");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
