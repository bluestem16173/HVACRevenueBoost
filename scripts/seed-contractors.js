const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function seedContractors() {
  console.log('👷 Seeding Local Contractors...');

  const contractors = [
    { company_name: 'Phoenix Heat & Air', trade: 'HVAC', city: 'Phoenix', city_slug: 'phoenix', state: 'AZ' },
    { company_name: 'Desert Cooling Pros', trade: 'HVAC', city: 'Phoenix', city_slug: 'phoenix', state: 'AZ' },
    { company_name: 'Houston Bayou Heating', trade: 'HVAC', city: 'Houston', city_slug: 'houston', state: 'TX' },
    { company_name: 'Lone Star Climate', trade: 'HVAC', city: 'Dallas', city_slug: 'dallas', state: 'TX' },
    { company_name: 'Magic City AC', trade: 'HVAC', city: 'Miami', city_slug: 'miami', state: 'FL' }
  ];

  try {
    for (const c of contractors) {
      await sql`
        INSERT INTO contractors (company_name, trade, city, city_slug, state)
        VALUES (${c.company_name}, ${c.trade}, ${c.city}, ${c.city_slug}, ${c.state})
        ON CONFLICT DO NOTHING
      `;
    }
    console.log('✅ Contractors seeded.');
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

seedContractors();
