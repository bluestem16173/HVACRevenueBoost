import 'dotenv/config';
import sql from '../lib/db';

async function run() {
  const res = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'generation_queue'`;
  console.log(JSON.stringify(res.map(r => r.column_name), null, 2));
  process.exit(0);
}
run();
