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

    // 2. Queue Component Pages
    const components = [
      "compressor", "evaporator coil", "condenser", "thermostat", 
      "control board", "blower motor", "refrigerant line", "capacitor", 
      "contactor", "drain line", "filter", "heat exchanger", 
      "inducer motor", "flame sensor", "igniter", "humidifier", 
      "air handler", "ductwork", "reversing valve", "defrost board"
    ];

    for (const comp of components) {
      const compSlug = comp.replace(/\s+/g, '-');
      const proposedSlug = `components/${compSlug}`;
      const proposedTitle = `${comp.charAt(0).toUpperCase() + comp.slice(1)} Troubleshooting & Repair Guide`;

      await sql`
        INSERT INTO generation_queue (
          page_type, 
          status, 
          proposed_slug, 
          proposed_title
        )
        VALUES (
          'component', 
          'queued', 
          ${proposedSlug}, 
          ${proposedTitle}
        )
        ON CONFLICT DO NOTHING
      `;
      count++;
    }

    console.log(`✅ Successfully queued ${count} page candidates.`);
  } catch (error) {
    console.error('❌ Population failed:', error);
  }
}

populate();
