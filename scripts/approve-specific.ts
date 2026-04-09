import "dotenv/config";
import sql from '../lib/db';

async function approveSpecific() {
  console.log("🛠️ Approving core ranking pages...");
  
  try {
    const slugs = [
      'ac-not-cooling',
      'ac-running-but-not-cooling',
      'ac-blowing-warm-air',
      'ac-short-cycling',
      'ac-weak-airflow',
      'tampa-ac-not-cooling',
      'orlando-ac-not-cooling',
      'fort-myers-ac-not-cooling'
    ];

    const result = await sql`
      UPDATE pages
      SET quality_status = 'approved'
      WHERE slug = ANY(${slugs}::text[])
      RETURNING slug;
    `;

    console.log(`✅ Successfully approved ${result.length} pages:`);
    result.forEach(row => console.log(`  - ${row.slug}`));
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to update statuses:", error);
    process.exit(1);
  }
}

approveSpecific();
