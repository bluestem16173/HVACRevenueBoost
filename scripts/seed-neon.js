const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

// Seed data summarized from knowledge-graph.ts
const REPAIRS = {
  "recharge-refrigerant": { name: "Refrigerant Recharge", description: "Adding refrigerant to the system to restore cooling performance.", estimatedCost: "medium", component: "refrigerant line" },
  "replace-capacitor": { name: "Start/Run Capacitor Replacement", description: "Replacing a failed capacitor that helps the compressor or fan motor start.", estimatedCost: "low", component: "capacitor" },
  "clean-evaporator-coil": { name: "Evaporator Coil Cleaning", description: "Removing dust and debris from the indoor coil to improve heat exchange.", estimatedCost: "low", component: "evaporator coil" },
  "replace-blower-motor": { name: "Blower Motor Replacement", description: "Installing a new motor for the indoor air handler unit.", estimatedCost: "high", component: "blower motor" },
  "replace-thermostat": { name: "Thermostat Replacement", description: "Upgrading or replacing a faulty wall thermostat.", estimatedCost: "low", component: "thermostat" },
  "replace-compressor": { name: "Compressor Replacement", description: "Replacing the main pump in the outdoor unit.", estimatedCost: "high", component: "compressor" },
  "clear-drain-line": { name: "Condensate Drain Line Clearing", description: "Removing blockages from the water drain line to prevent leaks.", estimatedCost: "low", component: "drain line" },
  "replace-air-filter": { name: "High-Efficiency Air Filter Replacement", description: "Installing a new, clean filter to improve airflow and air quality.", estimatedCost: "low", component: "filter" },
  "replace-igniter": { name: "Furnace Igniter Replacement", description: "Replacing the heating element that lights the furnace burners.", estimatedCost: "low", component: "igniter" },
  "clean-flame-sensor": { name: "Flame Sensor Cleaning/Replacement", description: "Cleaning the sensor that confirms the burner has lit.", estimatedCost: "low", component: "flame sensor" },
  "replace-contactor": { name: "AC Contactor Replacement", description: "Replacing the switch that controls the outdoor unit's power.", estimatedCost: "low", component: "contactor" },
  "duct-sealing": { name: "Ductwork Sealing", description: "Sealing leaks in the air ducts to improve efficiency and airflow.", estimatedCost: "medium", component: "ductwork" },
  "replace-reversing-valve": { name: "Heat Pump Reversing Valve Replacement", description: "Replacing the valve that allows a heat pump to switch between heating and cooling.", estimatedCost: "high", component: "reversing valve" },
  "replace-defrost-board": { name: "Defrost Control Board Replacement", description: "Installing a new board that manages the ice-melting cycle on heat pumps.", estimatedCost: "medium", component: "defrost board" }
};

const CAUSES = {
  "refrigerant-leak": { name: "Low Refrigerant Levels", explanation: "A leak in the refrigerant lines prevents the system from absorbing heat efficiently.", component: "refrigerant line", repairs: ["recharge-refrigerant"] },
  "failed-capacitor": { name: "Blown Start Capacitor", explanation: "The capacitor provides the electrical 'kick' needed to start the compressor; without it, the motor won't turn.", component: "capacitor", repairs: ["replace-capacitor"] },
  "dirty-coils": { name: "Dirty Evaporator Coils", explanation: "Dust buildup on the coils restricts airflow and stops heat absorption.", component: "evaporator coil", repairs: ["clean-evaporator-coil"] },
  "faulty-thermostat": { name: "Incorrect Thermostat Calibration", explanation: "If the thermostat fails to sense the correct temperature, it won't signal the HVAC to run.", component: "thermostat", repairs: ["replace-thermostat"] },
  "clogged-drain": { name: "Clogged Condensate Drain", explanation: "Algae and dust can block the drain, causing water to back up and trip safety switches.", component: "drain line", repairs: ["clear-drain-line"] },
  "dirty-filter": { name: "Severely Clogged Air Filter", explanation: "A dirty filter restricts airflow, putting strain on the blower motor and reducing efficiency.", component: "filter", repairs: ["replace-air-filter"] },
  "worn-igniter": { name: "Cracked Furnace Igniter", explanation: "Over time, the igniter becomes brittle and cracks, preventing the furnace from lighting.", component: "igniter", repairs: ["replace-igniter"] },
  "dirty-flame-sensor": { name: "Oxidized Flame Sensor", explanation: "Soot buildup on the sensor causes it to lose its ability to detect the flame, shutting down the furnace.", component: "flame sensor", repairs: ["clean-flame-sensor"] },
  "welded-contactor": { name: "Welded AC Contactor", explanation: "Electrical arcing can 'weld' the contactor shut, causing the outdoor unit to run constantly.", component: "contactor", repairs: ["replace-contactor"] },
  "leaky-ducts": { name: "Leaking Air Ducts", explanation: "Gaps in the ductwork allow conditioned air to escape into unconditioned spaces like attics.", component: "ductwork", repairs: ["duct-sealing"] },
  "stuck-reversing-valve": { name: "Stuck Reversing Valve", explanation: "If the valve is stuck, the heat pump may get trapped in one mode or fail to provide adequate temperature change.", component: "reversing valve", repairs: ["replace-reversing-valve"] },
  "bad-defrost-board": { name: "Failed Defrost Control", explanation: "A faulty board can cause the outdoor unit to freeze over in winter, blocking heat absorption.", component: "defrost board", repairs: ["replace-defrost-board"] }
};

const SYMPTOMS = [
  { id: "ac-blowing-warm-air", name: "AC Blowing Warm Air", description: "Your air conditioner is running, but the air coming out of the vents is not cold.", causes: ["refrigerant-leak", "dirty-coils", "failed-capacitor", "dirty-filter", "welded-contactor", "leaky-ducts"] },
  { id: "ac-not-turning-on", name: "AC System Won't Turn On", description: "The entire HVAC system is unresponsive when you try to start it.", causes: ["faulty-thermostat", "failed-capacitor", "welded-contactor", "bad-defrost-board"] },
  { id: "furnace-not-heating", name: "Furnace Not Heating", description: "The furnace fan is blowing, but the air is not warm or it won't stay lit.", causes: ["worn-igniter", "dirty-flame-sensor", "faulty-thermostat", "dirty-filter"] },
  { id: "hvac-leaking-water", name: "HVAC System Leaking Water", description: "You notice water pooling around the indoor unit or dripping from the ceiling.", causes: ["clogged-drain", "dirty-coils", "dirty-filter"] },
  { id: "ac-running-constantly", name: "AC Running Constantly", description: "The system never shuts off, even after the desired temperature is reached.", causes: ["welded-contactor", "dirty-filter", "dirty-coils", "faulty-thermostat", "leaky-ducts"] },
  { id: "strange-noises-hvac", name: "Strange Noises from HVAC", description: "Banging, whistling, or grinding sounds coming from your heating or cooling system.", causes: ["failed-capacitor", "dirty-filter", "clogged-drain", "leaky-ducts"] },
  { id: "high-electric-bills-hvac", name: "High Electric Bills", description: "An unexplained spike in your energy consumption related to your HVAC system.", causes: ["dirty-coils", "dirty-filter", "refrigerant-leak", "leaky-ducts"] },
  { id: "uneven-cooling-heating", name: "Uneven Cooling or Heating", description: "Some rooms are significantly warmer or cooler than others in your home.", causes: ["dirty-filter", "leaky-ducts", "faulty-thermostat"] },
  { id: "hvac-unit-short-cycling", name: "HVAC Unit Short Cycling", description: "The system turns on and off rapidly without reaching the set temperature.", causes: ["dirty-filter", "failed-capacitor", "faulty-thermostat", "refrigerant-leak"] },
  { id: "bad-odors-from-vents", name: "Bad Odors from Vents", description: "Musty, burning, or rotten egg smells coming through your air registers.", causes: ["clogged-drain", "dirty-coils", "dirty-filter"] },
  { id: "heat-pump-not-switching", name: "Heat Pump Not Switching Modes", description: "Your heat pump is stuck in cooling mode during winter or heating mode during summer.", causes: ["stuck-reversing-valve", "bad-defrost-board", "faulty-thermostat"] },
  { id: "ice-on-outdoor-unit", name: "Ice on Outdoor Unit", description: "Frost or ice buildup on the coils of your outdoor AC or heat pump unit.", causes: ["dirty-coils", "dirty-filter", "refrigerant-leak", "bad-defrost-board"] },
  { id: "humidity-too-high-home", name: "Humidity Too High Indoors", description: "Your home feels clammy or sticky even when the AC is running.", causes: ["dirty-coils", "dirty-filter", "refrigerant-leak", "clogged-drain"] },
  { id: "furnace-blowing-cold-air", name: "Furnace Blowing Cold Air", description: "The heater is active, but the air coming through the vents is room-temperature or cold.", causes: ["worn-igniter", "dirty-flame-sensor", "faulty-thermostat"] },
  { id: "noisy-outdoor-condenser", name: "Noisy Outdoor Condenser", description: "Loud buzzing, rattling, or clicking from the outdoor HVAC unit.", causes: ["failed-capacitor", "welded-contactor", "refrigerant-leak"] },
  { id: "hvac-tripping-breaker", name: "HVAC Tripping Circuit Breaker", description: "Your heating or cooling system causes the electrical panel to trip frequently.", causes: ["failed-capacitor", "welded-contactor", "dirty-coils"] },
  { id: "thermostat-display-blank", name: "Thermostat Display blank", description: "No power or information showing on your wall-mounted HVAC control panel.", causes: ["faulty-thermostat", "clogged-drain"] },
  { id: "weak-airflow-vents", name: "Weak Airflow from Vents", description: "Air is coming out, but the pressure is significantly lower than normal.", causes: ["dirty-filter", "leaky-ducts", "dirty-coils"] },
  { id: "furnace-clicking-no-ignition", name: "Furnace Clicking but No Ignition", description: "You hear the furnace trying to start, but no heat is produced.", causes: ["worn-igniter", "dirty-flame-sensor"] },
  { id: "ac-smells-musty", name: "AC Smells Musty", description: "A stale 'dirty sock' smell when the air conditioning turns on.", causes: ["clogged-drain", "dirty-coils"] },
  { id: "burning-smell-hvac", name: "Burning Smell from HVAC", description: "The scent of burning plastic or electricity when the system is running.", causes: ["failed-capacitor", "welded-contactor"] },
  { id: "hvac-clunking-sound", name: "HVAC Clunking Sound", description: "A heavy, irregular sound coming from the metal casing of your indoor or outdoor unit.", causes: ["failed-capacitor", "welded-contactor"] },
  { id: "constant-fan-running", name: "Fan Running Constantly", description: "The indoor blower fan never stops, even when the system isn't heating or cooling.", causes: ["faulty-thermostat", "welded-contactor"] }
];

const CITIES = [
  { name: "Phoenix", slug: "phoenix", state: "AZ" },
  { name: "Houston", slug: "houston", state: "TX" },
  { name: "Miami", slug: "miami", state: "FL" },
  { name: "Dallas", slug: "dallas", state: "TX" },
  { name: "Atlanta", slug: "atlanta", state: "GA" },
  { name: "Las Vegas", slug: "las-vegas", state: "NV" },
  { name: "Orlando", slug: "orlando", state: "FL" },
  { name: "San Antonio", slug: "san-antonio", state: "TX" },
  { name: "Tampa", slug: "tampa", state: "FL" },
  { name: "Austin", slug: "austin", state: "TX" },
  { name: "Charlotte", slug: "charlotte", state: "NC" },
  { name: "Denver", slug: "denver", state: "CO" },
  { name: "Nashville", slug: "nashville", state: "TN" },
  { name: "Jacksonville", slug: "jacksonville", state: "FL" },
  { name: "Fort Worth", slug: "fort-worth", state: "TX" },
  { name: "Columbus", slug: "columbus", state: "OH" },
  { name: "Indianapolis", slug: "indianapolis", state: "IN" },
  { name: "Raleigh", slug: "raleigh", state: "NC" },
  { name: "Scottsdale", slug: "scottsdale", state: "AZ" },
  { name: "Gilbert", slug: "gilbert", state: "AZ" },
  { name: "Mesa", slug: "mesa", state: "AZ" },
  { name: "Tempe", slug: "tempe", state: "AZ" },
  { name: "Chandler", slug: "chandler", state: "AZ" },
  { name: "Arlington", slug: "arlington", state: "TX" },
  { name: "Plano", slug: "plano", state: "TX" }
];

const sql = neon(process.env.DATABASE_URL);

async function seed() {
  console.log('🌱 Starting Robust Seeder...');

  try {
    // 1. System
    const sysResults = await sql`
      INSERT INTO systems (name, slug, category, description)
      VALUES ('Residential HVAC', 'residential-hvac', 'HVAC', 'Complete guide to residential heating and cooling diagnostics.')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;
    const systemId = sysResults[0].id;
    console.log(`✅ System created/verified: ${systemId}`);

    // 2. Repairs
    console.log('🔧 Seeding Repairs...');
    for (const [slug, repair] of Object.entries(REPAIRS)) {
      try {
        await sql`
          INSERT INTO repairs (name, slug, repair_type, skill_level)
          VALUES (${repair.name}, ${slug}, ${repair.estimatedCost}, 'Technical')
          ON CONFLICT (slug) DO NOTHING
        `;
      } catch (e) { console.error(`Failed repair ${slug}:`, e.message); }
    }

    // 3. Causes
    console.log('🔍 Seeding Causes...');
    const causeIdMap = {};
    for (const [slug, cause] of Object.entries(CAUSES)) {
      try {
        const results = await sql`
          INSERT INTO causes (system_id, name, slug, difficulty)
          VALUES (${systemId}, ${cause.name}, ${slug}, 'Intermediate')
          ON CONFLICT (system_id, slug) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `;
        causeIdMap[slug] = results[0].id;

        // Link repairs
        for (const repairSlug of cause.repairs) {
          await sql`UPDATE repairs SET cause_id = ${results[0].id} WHERE slug = ${repairSlug}`;
        }
      } catch (e) { console.error(`Failed cause ${slug}:`, e.message); }
    }

    // 4. Symptoms
    console.log('🤒 Seeding Symptoms...');
    for (const symptom of SYMPTOMS) {
      try {
        const results = await sql`
          INSERT INTO symptoms (system_id, name, slug, search_intent)
          VALUES (${systemId}, ${symptom.name}, ${symptom.id}, 'troubleshooting')
          ON CONFLICT (system_id, slug) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `;
        const symptomId = results[0].id;

        for (const causeSlug of symptom.causes) {
          const dbCauseId = causeIdMap[causeSlug];
          if (dbCauseId) {
            await sql`
              INSERT INTO symptom_causes (symptom_id, cause_id)
              VALUES (${symptomId}, ${dbCauseId})
              ON CONFLICT DO NOTHING
            `;
          }
        }
      } catch (e) { console.error(`Failed symptom ${symptom.id}:`, e.message); }
    }

    // 5. Cities
    console.log('🏙️ Seeding Cities...');
    for (const city of CITIES) {
      try {
        await sql`
          INSERT INTO cities (city, state, slug)
          VALUES (${city.name}, ${city.state}, ${city.slug})
          ON CONFLICT (slug) DO NOTHING
        `;
      } catch (e) { console.error(`Failed city ${city.slug}:`, e.message); }
    }

    console.log('🚀 SEEDING COMPLETE');
  } catch (error) {
    console.error('FATAL SEED ERROR:', error);
  }
}

seed();
