const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function buildLinks() {
  console.log('🔗 Building Semantic Triangle Graph...');

  try {
    // 1. Fetch all city repair pages
    const cityPages = await sql`
      SELECT id, slug, city, symptom_id 
      FROM pages 
      WHERE page_type = 'city'
    `;

    console.log(`📊 Processing links for ${cityPages.length} pages...`);

    for (const page of cityPages) {
      // A. PILLAR LINK: Local -> Main Hub
      // Find the hub page for this symptom
      const hubs = await sql`
        SELECT slug FROM symptoms WHERE id = ${page.symptom_id} LIMIT 1
      `;
      if (hubs[0]) {
        const hubSlug = `diagnose/${hubs[0].slug}`;
        await sql`
          INSERT INTO internal_links (source_slug, target_slug, anchor_text, link_reason)
          VALUES (${page.slug}, ${hubSlug}, 'Troubleshooting Guide', 'pillar')
          ON CONFLICT DO NOTHING
        `;
      }

      // B. SIBLING LINKS: Local -> Other Local in same city
      const siblings = await sql`
        SELECT slug, title FROM pages 
        WHERE city = ${page.city} AND id != ${page.id} 
        LIMIT 3
      `;
      for (const sib of siblings) {
        await sql`
          INSERT INTO internal_links (source_slug, target_slug, anchor_text, link_reason)
          VALUES (${page.slug}, ${sib.slug}, ${sib.title}, 'sibling')
          ON CONFLICT DO NOTHING
        `;
      }

      // C. REVERSE PILLAR: Hub -> Local (To boost local indexing)
      if (hubs[0]) {
        const hubSlug = `diagnose/${hubs[0].slug}`;
        await sql`
          INSERT INTO internal_links (source_slug, target_slug, anchor_text, link_reason)
          VALUES (${hubSlug}, ${page.slug}, ${page.city + ' Experts'}, 'reverse_pillar')
          ON CONFLICT DO NOTHING
        `;
      }
    }

    console.log('✅ Internal linking graph established.');
  } catch (error) {
    console.error('❌ Linking failed:', error.message);
  }
}

buildLinks();
