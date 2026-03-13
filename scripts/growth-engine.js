const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function runExpansion() {
  console.log('📈 Running DecisionGrid Growth Engine...');

  try {
    // 1. SYMPTOM HARVEST
    // Logic: Convert raw queries into validated symptoms/pages
    const harvestItems = await sql`
      SELECT * FROM symptom_harvest 
      WHERE status = 'pending' AND score > 0.7
    `;
    console.log(`🌾 Harvesting ${harvestItems.length} new symptom queries...`);

    for (const item of harvestItems) {
      // Typically we would check if it exists, then queue for all cities
      // For this demo, we'll just queue a few sample cities to show the flywheel
      const cities = await sql`SELECT city, slug FROM cities LIMIT 5`; 
      for (const city of cities) {
        const slug = `repair/${city.slug}/${item.slug || 'new-issue'}`;
        await sql`
          INSERT INTO generation_queue (page_type, proposed_slug, proposed_title, city)
          VALUES ('city', ${slug}, ${item.query + ' in ' + city.city}, ${city.city})
          ON CONFLICT DO NOTHING
        `;
      }
      await sql`UPDATE symptom_harvest SET status = 'completed' WHERE id = ${item.id}`;
    }

    // 2. CLUSTER EXPANSION
    // Logic: Expand existing pillar pages into long-tail clusters
    const expansionItems = await sql`
      SELECT * FROM cluster_expansion_queue 
      WHERE status = 'pending'
    `;
    console.log(`🌱 Expanding ${expansionItems.length} clusters...`);

    for (const item of expansionItems) {
      // Create a "breakout" page for the specific long-tail keyword
      const breakoutSlug = `breakout/${item.page_slug}/${item.query.toLowerCase().replace(/ /g, '-')}`;
      await sql`
        INSERT INTO generation_queue (page_type, proposed_slug, proposed_title)
        VALUES ('breakout', ${breakoutSlug}, ${item.query})
        ON CONFLICT DO NOTHING
      `;
      await sql`UPDATE cluster_expansion_queue SET status = 'completed' WHERE id = ${item.id}`;
    }

    console.log('✅ Growth batch complete.');
  } catch (error) {
    console.error('❌ Growth Engine failed:', error.message);
  }
}

// Mock some harvest/expansion data if table is empty, just to demonstrate
async function mockData() {
  console.log('🧪 Mocking growth candidates...');
  await sql`
    INSERT INTO symptom_harvest (query, slug, score, status)
    VALUES ('hvac whistling noise', 'whistling-noise', 0.85, 'pending')
    ON CONFLICT DO NOTHING
  `;
  await sql`
    INSERT INTO cluster_expansion_queue (query, page_slug, status)
    VALUES ('how to fix hvac whistling at night', 'ac-blowing-warm-air', 'pending')
    ON CONFLICT DO NOTHING
  `;
}

async function start() {
  await mockData();
  await runExpansion();
}

start();
