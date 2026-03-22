import "dotenv/config";
import sql from '../lib/db';

async function run() {
  try {
    await sql`INSERT INTO generation_queue (proposed_slug, page_type, status) VALUES ('cause/low-refrigerant', 'cause', 'pending') ON CONFLICT DO NOTHING`;
    console.log('Queued cause/low-refrigerant');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
