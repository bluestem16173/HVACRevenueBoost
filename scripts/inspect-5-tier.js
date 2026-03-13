const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function inspect() {
  try {
    const components = await sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'components'`;
    console.log('Components table exists:', components.length > 0);

    const tools = await sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'tools'`;
    console.log('Tools table exists:', tools.length > 0);
    
    if (components.length > 0) {
      const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'causes' AND column_name = 'component_id'`;
      console.log('Causes has component_id:', cols.length > 0);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
inspect();
