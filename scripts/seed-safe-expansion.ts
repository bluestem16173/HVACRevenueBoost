import "dotenv/config";
import sql from '../lib/db';

const topics = [
  'ac-not-cooling-in-afternoon',
  'ac-airflow-inconsistent',
  'air-not-reaching-back-rooms',
  'vents-not-blowing-strong-air',
  'ac-water-pooling-around-unit',
  'ac-drain-line-overflow'
];

async function seed() {
  console.log("🌱 Seeding Safe Expansion Topics...");
  for (const t of topics) {
    const title = t.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const slug = `diagnose/${t}`;

    await sql`
      INSERT INTO generation_queue (proposed_slug, proposed_title, page_type, status, error_message)
      VALUES (${slug}, ${title}, 'diagnose', 'pending', NULL)
      ON CONFLICT (proposed_slug) DO UPDATE SET status = 'pending', error_message = NULL
    `;
    console.log(`✅ Queued: ${slug}`);
  }
  console.log("🎉 Done! Run 'npm run worker' to process.");
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
