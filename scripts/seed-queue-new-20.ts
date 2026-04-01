import sql from '../lib/db';

async function seedQueue() {
  const causes = [
    'ac-compressor-thermal-overload',
    'bad-ac-disconnect-box',
    'refrigerant-line-insulation-missing',
    'improper-hvac-sizing',
    'furnace-draft-inducer-motor-failed',
    'clogged-flame-sensor',
    'bad-gas-valve-furnace',
    'frozen-evaporator-coil',
    'leaking-ac-condensate-pump',
    'r410a-refrigerant-leak-detected',
    'faulty-thermostat-wiring',
    'blown-hvac-transformer',
    'burnt-compressor-terminals',
    'oversized-ac-unit-short-cycling',
    'undersized-ac-unit-running-constantly',
    'blocked-return-air-grille',
    'collapsed-flexible-ductwork',
    'bad-start-capacitor-ac',
    'faulty-defrost-thermostat',
    'stuck-ac-contactor-relay'
  ];

  for (const c of causes) {
    await sql`
      INSERT INTO generation_queue (proposed_slug, page_type, status)
      VALUES (${c}, 'cause', 'draft')
      ON CONFLICT DO NOTHING
    `;
    console.log(`Inserted ${c} into queue`);
  }
  process.exit(0);
}

seedQueue();
