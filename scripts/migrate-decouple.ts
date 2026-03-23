import sql from '../lib/db';

async function migrate() {
  console.log('Starting Migration...');

  // 1. Add city column if not exists
  try {
    await sql`ALTER TABLE pages ADD COLUMN city VARCHAR(255) NULL;`;
    console.log('Added city column to pages');
  } catch (e: any) {
    console.log('City column might exist:', e.message);
  }

  // 2. Add city to generation_queue if not exists
  try {
    await sql`ALTER TABLE generation_queue ADD COLUMN city VARCHAR(255) NULL;`;
    console.log('Added city column to generation_queue');
  } catch (e: any) {
    console.log('City column might exist on queue:', e.message);
  }

  // 3. Clean Causes Slugs in Pages
  const causesRes = await sql`UPDATE pages SET slug = REPLACE(slug, 'causes/', ''), page_type = 'cause' WHERE slug LIKE 'causes/%' RETURNING *;`;
  console.log(`Cleaned ${causesRes.length} causes slugs in pages`);

  // 4. Clean Diagnose Slugs in Pages
  const diagRes = await sql`UPDATE pages SET slug = REPLACE(slug, 'diagnose/', ''), page_type = 'diagnose' WHERE slug LIKE 'diagnose/%' RETURNING *;`;
  console.log(`Cleaned ${diagRes.length} diagnose slugs in pages`);

  // 5. Clean Repair Slugs in Pages
  const repairRes = await sql`UPDATE pages SET city = split_part(slug, '/', 2), slug = split_part(slug, '/', 3), page_type = 'repair' WHERE slug LIKE 'repair/%' RETURNING *;`;
  console.log(`Cleaned ${repairRes.length} repair slugs in pages`);

  // 6. Clean Causes Slugs in Queue
  const qCauses = await sql`UPDATE generation_queue SET proposed_slug = REPLACE(proposed_slug, 'causes/', ''), page_type = 'cause' WHERE proposed_slug LIKE 'causes/%' RETURNING *;`;
  console.log(`Cleaned ${qCauses.length} causes in queue`);

  // 7. Clean Diagnose Slugs in Queue
  const qDiag = await sql`UPDATE generation_queue SET proposed_slug = REPLACE(proposed_slug, 'diagnose/', ''), page_type = 'diagnose' WHERE proposed_slug LIKE 'diagnose/%' RETURNING *;`;
  console.log(`Cleaned ${qDiag.length} diagnose in queue`);

  // 8. Clean Repair Slugs in Queue
  const qRepair = await sql`UPDATE generation_queue SET city = split_part(proposed_slug, '/', 2), proposed_slug = split_part(proposed_slug, '/', 3), page_type = 'repair' WHERE proposed_slug LIKE 'repair/%' RETURNING *;`;
  console.log(`Cleaned ${qRepair.length} repair in queue`);

  // 9. Fix Canonical Unique Constraint
  try {
    await sql`ALTER TABLE pages DROP CONSTRAINT pages_slug_key CASCADE;`;
  } catch(e) {}
  try {
    await sql`ALTER TABLE pages DROP CONSTRAINT pages_clean_slug_key CASCADE;`;
  } catch(e) {}
  try {
    await sql`DROP INDEX IF EXISTS idx_pages_canonical CASCADE;`;
  } catch(e) {}

  try {
    await sql`CREATE UNIQUE INDEX idx_pages_canonical ON pages (slug, page_type, city);`;
    console.log('Created Canonical Index on pages(slug, page_type, city)');
  } catch (e: any) {
    console.log('Index error:', e.message);
    
    // Fallback: If there are exact collisions right now, we delete duplicates before creating index
    console.log('Attempting deduplication to force index...');
    await sql`
      DELETE FROM pages
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM pages
        GROUP BY slug, page_type, city
      );
    `;
    await sql`CREATE UNIQUE INDEX idx_pages_canonical ON pages (slug, page_type, city);`;
    console.log('Created Canonical Index after deduplication.');
  }

  process.exit(0);
}

migrate();
