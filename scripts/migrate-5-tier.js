const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('🚀 Starting 5-Tier Architecture Migration...');

  try {
    // 1. Create components table
    console.log('📦 Creating components table...');
    await sql`
      CREATE TABLE IF NOT EXISTS components (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        system_id UUID REFERENCES systems(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 2. Create tools table
    console.log('🧰 Creating tools table...');
    await sql`
      CREATE TABLE IF NOT EXISTS tools (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        affiliate_link TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 3. Create repair_tools join table
    console.log('🔗 Creating repair_tools map...');
    await sql`
      CREATE TABLE IF NOT EXISTS repair_tools (
        repair_id UUID REFERENCES repairs(id) ON DELETE CASCADE,
        tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
        PRIMARY KEY (repair_id, tool_id)
      )
    `;

    // 4. Update causes table to support component_id instead of just string
    // Let's add component_id as a foreign key to causes and repairs
    console.log('🔄 Updating causes & repairs with component_id...');
    await sql`ALTER TABLE causes ADD COLUMN IF NOT EXISTS component_id UUID REFERENCES components(id) ON DELETE SET NULL`;
    await sql`ALTER TABLE repairs ADD COLUMN IF NOT EXISTS component_id UUID REFERENCES components(id) ON DELETE SET NULL`;

    // Add search_intent to generated_pages if not exists to differentiate page types in semantic triangle
    await sql`ALTER TABLE generated_pages ADD COLUMN IF NOT EXISTS search_intent VARCHAR(50) DEFAULT 'troubleshooting'`;

    console.log('✅ Migration complete! Schema is now ready for 5-Tier Growth.');
  } catch (error) {
    console.error('FATAL MIGRATION ERROR:', error);
  }
}

migrate();
