import 'dotenv/config';
import sql from '../lib/db';

async function run() {
  const res = await sql`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'pages'`;
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}
run();
