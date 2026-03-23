import 'dotenv/config';
import sql from '../lib/db';

async function check() {
  const res = await sql`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'pages';
  `;
  require('fs').writeFileSync('out.json', JSON.stringify(res, null, 2));
}
check();
