import sql from '../lib/db';
async function seedQueue() {
  const causes = [
    'restricted-hvac-airflow',
    'bad-contactor-outside-unit',
    'faulty-run-capacitor',
    'clogged-drain-pan',
    'dirty-blower-wheel',
    'low-voltage-short-hvac',
    'dirty-sensor-furnace',
    'cracked-heat-exchanger',
    'reversing-valve-stuck',
    'defrost-board-failure',
    'compressor-hard-start-needed',
    'txv-valve-stuck-closed',
    'evaporator-coil-leak',
    'condenser-fan-motor-failure',
    'indoor-blower-motor-bad',
    'short-cycling-ac',
    'tripped-high-pressure-switch',
    'furnace-limit-switch-open',
    'control-board-relay-stuck',
    'ductwork-static-pressure-high'
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
