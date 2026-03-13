const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

// Basic initial dataset for the 5-Tier architecture
const COMPONENTS = [
  { name: "Capacitor", slug: "capacitor", description: "Provides the electrical kick to start the compressor and fan motors." },
  { name: "Compressor", slug: "compressor", description: "The heart of the AC, pumps refrigerant through the system." },
  { name: "Evaporator Coil", slug: "evaporator-coil", description: "Absorbs heat from indoor air." },
  { name: "Condenser Coil", slug: "condenser-coil", description: "Releases absorbed heat to the outside air." },
  { name: "Blower Motor", slug: "blower-motor", description: "Circulates conditioned air through the ductwork." },
  { name: "Thermostat", slug: "thermostat", description: "The control center for your HVAC system." },
  { name: "Drain Line", slug: "drain-line", description: "Carries away condensation from the evaporator coil." },
  { name: "Air Filter", slug: "filter", description: "Protects the system from dust and improves indoor air quality." },
  { name: "Furnace Igniter", slug: "igniter", description: "Lights the gas burners in a furnace." },
  { name: "Flame Sensor", slug: "flame-sensor", description: "Detects if the furnace burners are lit for safety." },
  { name: "Contactor", slug: "contactor", description: "The high-voltage relay that turns the outdoor unit on and off." },
  { name: "Ductwork", slug: "ductwork", description: "The system of tubes that delivers air throughout the home." },
  { name: "Reversing Valve", slug: "reversing-valve", description: "Allows a heat pump to switch between heating and cooling modes." },
  { name: "Defrost Control Board", slug: "defrost-board", description: "Manages the defrost cycle on heat pumps to prevent ice buildup." },
  { name: "Refrigerant Line", slug: "refrigerant-line", description: "Copper tubing that carries refrigerant between indoor and outdoor units." }
];

const TOOLS = [
  { name: "Digital Multimeter", slug: "multimeter", description: "Used to test voltage, continuity, and capacitance on electrical components like capacitors and contactors." },
  { name: "Screwdriver Set", slug: "screwdrivers", description: "Essential for removing access panels and securing electrical terminals." },
  { name: "Nut Drivers", slug: "nut-drivers", description: "Used extensively for removing hex-head screws on HVAC cabinets." },
  { name: "Refrigerant Gauges", slug: "refrigerant-gauges", description: "Measures system pressures; requires EPA certification to use legally." },
  { name: "Shop Vac", slug: "shop-vac", description: "Used to clear clogged condensate drain lines." },
  { name: "Coil Cleaning Spray", slug: "coil-cleaner", description: "Self-rinsing or foaming cleaner to remove dirt from evaporator and condenser coils." },
  { name: "Wire Strippers", slug: "wire-strippers", description: "For repairing damaged electrical connections." },
  { name: "Adjustable Wrench", slug: "adjustable-wrench", description: "For loosening and tightening refrigerant line fittings and gas valves." }
];

// Mapping repairs to required tools 
const REPAIR_TOOLS = {
  "replace-capacitor": ["multimeter", "screwdrivers", "nut-drivers"],
  "clean-evaporator-coil": ["screwdrivers", "nut-drivers", "coil-cleaner"],
  "replace-contactor": ["multimeter", "screwdrivers", "wire-strippers"],
  "clear-drain-line": ["shop-vac"],
  "replace-thermostat": ["screwdrivers", "wire-strippers"]
};

async function seed() {
  console.log('🌱 Starting 5-Tier Data Seeding...');

  try {
    // Get the primary system ID (Residential HVAC)
    const sysResult = await sql`SELECT id FROM systems WHERE slug = 'residential-hvac' LIMIT 1`;
    if (sysResult.length === 0) {
      console.log('❌ System not found.');
      return;
    }
    const systemId = sysResult[0].id;

    // 1. Seed Components
    console.log('📦 Seeding Components...');
    const componentIdMap = {};
    for (const comp of COMPONENTS) {
      const result = await sql`
        INSERT INTO components (system_id, name, slug, description)
        VALUES (${systemId}, ${comp.name}, ${comp.slug}, ${comp.description})
        ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description
        RETURNING id
      `;
      componentIdMap[comp.slug] = result[0].id;
    }

    // 2. Seed Tools
    console.log('🧰 Seeding Tools...');
    const toolIdMap = {};
    for (const tool of TOOLS) {
      const result = await sql`
        INSERT INTO tools (name, slug, description)
        VALUES (${tool.name}, ${tool.slug}, ${tool.description})
        ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description
        RETURNING id
      `;
      toolIdMap[tool.slug] = result[0].id;
    }

    // 3. Link existing Causes and Repairs to Components
    console.log('🔗 Linking Causes and Repairs to Components...');
    
    // We recreate the maps from seed-neon.js locally to find which repair/cause belongs to which component
    const REPAIRS_MAP = {
      "recharge-refrigerant": "refrigerant-line",
      "replace-capacitor": "capacitor",
      "clean-evaporator-coil": "evaporator-coil",
      "replace-blower-motor": "blower-motor",
      "replace-thermostat": "thermostat",
      "replace-compressor": "compressor",
      "clear-drain-line": "drain-line",
      "replace-air-filter": "filter",
      "replace-igniter": "igniter",
      "clean-flame-sensor": "flame-sensor",
      "replace-contactor": "contactor",
      "duct-sealing": "ductwork",
      "replace-reversing-valve": "reversing-valve",
      "replace-defrost-board": "defrost-board"
    };

    const CAUSES_MAP = {
      "refrigerant-leak": "refrigerant-line",
      "failed-capacitor": "capacitor",
      "dirty-coils": "evaporator-coil",
      "faulty-thermostat": "thermostat",
      "clogged-drain": "drain-line",
      "dirty-filter": "filter",
      "worn-igniter": "igniter",
      "dirty-flame-sensor": "flame-sensor",
      "welded-contactor": "contactor",
      "leaky-ducts": "ductwork",
      "stuck-reversing-valve": "reversing-valve",
      "bad-defrost-board": "defrost-board"
    };

    for (const [repairSlug, compSlug] of Object.entries(REPAIRS_MAP)) {
       const compId = componentIdMap[compSlug];
       if (compId) await sql`UPDATE repairs SET component_id = ${compId} WHERE slug = ${repairSlug}`;
    }

    for (const [causeSlug, compSlug] of Object.entries(CAUSES_MAP)) {
       const compId = componentIdMap[compSlug];
       if (compId) await sql`UPDATE causes SET component_id = ${compId} WHERE slug = ${causeSlug}`;
    }

    // 4. Link Repairs and Tools
    console.log('🔗 Seeding repair_tools join table...');
    for (const [repairSlug, toolSlugs] of Object.entries(REPAIR_TOOLS)) {
      const repairResult = await sql`SELECT id FROM repairs WHERE slug = ${repairSlug}`;
      if (repairResult.length > 0) {
        const repairId = repairResult[0].id;
        for (const toolSlug of toolSlugs) {
          const toolId = toolIdMap[toolSlug];
          if (toolId) {
            await sql`
              INSERT INTO repair_tools (repair_id, tool_id)
              VALUES (${repairId}, ${toolId})
              ON CONFLICT DO NOTHING
            `;
          }
        }
      }
    }

    console.log('✅ Seeding complete!');
  } catch (error) {
    console.error('FATAL SEED ERROR:', error);
  }
}

seed();
