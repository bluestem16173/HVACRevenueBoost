import sql from '../lib/db';
async function seedQueue() {
  const causes = [
    'bad-compressor-ac',
    'leaking-refrigerant-coil',
    'faulty-thermostat-sensor',
    'dirty-condenser-fins',
    'blown-ac-fuse'
  ];
  for (const c of causes) {
    await sql`
      INSERT INTO generation_queue (proposed_slug, page_type, status)
      VALUES (${c}, 'cause', 'pending')
      ON CONFLICT DO NOTHING
    `;
    console.log(`Inserted ${c} into queue`);
  }
  process.exit(0);
}
seedQueue();
