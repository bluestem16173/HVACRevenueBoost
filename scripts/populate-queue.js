const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function populate() {
  console.log('🚀 Populating Generation Queue (City x Symptom)...');

  try {
    // 1. Fetch data
    const symptoms = await sql`SELECT id, name, slug FROM symptoms`;
    const cities = await sql`SELECT city, state, slug FROM cities`;

    console.log(`📊 Found ${symptoms.length} symptoms and ${cities.length} cities.`);

    let count = 0;
    for (const city of cities) {
      for (const symptom of symptoms) {
        const proposedSlug = `repair/${city.slug}/${symptom.slug}`;
        const proposedTitle = `${symptom.name} Repair in ${city.city}, ${city.state}`;

        await sql`
          INSERT INTO generation_queue (
            page_type, 
            status, 
            proposed_slug, 
            proposed_title, 
            symptom_id, 
            city
          )
          VALUES (
            'city', 
            'queued', 
            ${proposedSlug}, 
            ${proposedTitle}, 
            ${symptom.id}, 
            ${city.city}
          )
          ON CONFLICT DO NOTHING
        `;
        count++;
      }
    }

    console.log(`✅ Successfully queued ${count} page candidates.`);
  } catch (error) {
    console.error('❌ Population failed:', error);
  }
}

populate();
