import 'dotenv/config'; 
import sql from './lib/db'; 

async function run() { 
  try { 
    const res = await (sql as any)`SELECT id, slug, page_type, status, site FROM pages ORDER BY id DESC LIMIT 20`; 
    console.log('=== DB PAGES ==='); 
    console.table(res); 
    process.exit(0);
  } catch (err) { 
    console.error(err); 
    process.exit(1);
  } 
} 
run();
