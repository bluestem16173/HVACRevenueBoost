const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function migrateQueryVariations() {
  console.log('🚀 Migrating DecisionGrid Neon DB: Adding query_variations...');

  try {
    const sql = neon(process.env.DATABASE_URL);

    console.log('🔄 Adding query_variations column to symptoms table...');
    await sql`
      ALTER TABLE symptoms 
      ADD COLUMN IF NOT EXISTS query_variations JSONB DEFAULT '[]'::jsonb;
    `;
    console.log('✅ Column added.');

    console.log('🌱 Seeding initial query variations for active symptom...');
    const symptomId = 'ac-blowing-warm-air';
    const variations = [
      "ac running but not cooling",
      "central air blowing warm air",
      "outside unit running but no cold air",
      "ac fan blowing warm air",
      "ac not cooling house",
      "why is my ac blowing warm air"
    ];

    await sql`
      UPDATE symptoms 
      SET query_variations = ${JSON.stringify(variations)}
      WHERE id = ${symptomId};
    `;
    console.log(`✅ Seeded query variations for ${symptomId}.`);

  } catch (err) {
    console.error('❌ Migration failed:', err);
  }

  console.log('🏁 Migration complete.');
}

migrateQueryVariations();
