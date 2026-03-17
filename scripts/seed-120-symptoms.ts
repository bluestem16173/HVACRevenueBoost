import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env.local');
}

const sql = neon(process.env.DATABASE_URL);

// Helper to convert string to slug
function toSlug(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const SYMPTOM_TIERS = {
  "Tier 1 – Highest Traffic HVAC Symptoms": [
    "ac blowing warm air",
    "ac not cooling house",
    "ac running but not cooling",
    "ac leaking water",
    "ac smells musty",
    "ac smells like burning",
    "ac smells like vinegar",
    "ac smells like rotten eggs",
    "ac making loud noise",
    "ac buzzing noise",
    "ac clicking noise",
    "ac rattling noise",
    "ac humming but not starting",
    "ac short cycling",
    "ac constantly running",
    "ac turning on and off",
    "ac fan not spinning",
    "ac outside unit not turning on",
    "ac compressor not turning on",
    "ac thermostat not working",
    "furnace not turning on",
    "furnace blowing cold air",
    "furnace making loud noise",
    "thermostat not responding",
    "thermostat blank screen"
  ],
  "Tier 2 – High Intent Diagnostic Symptoms": [
    "ac freezing up",
    "ac coil frozen",
    "ac condenser not running",
    "ac fan running but no cold air",
    "ac low airflow from vents",
    "ac weak airflow from vents",
    "ac high humidity in house",
    "ac blowing weak air",
    "ac temperature not reaching set point",
    "ac air not coming out of vents",
    "ac water pooling around unit",
    "ac drip pan overflowing",
    "ac unit vibrating",
    "ac breaker keeps tripping",
    "ac fuse keeps blowing",
    "ac capacitor failure symptoms",
    "ac contactor buzzing",
    "ac compressor overheating",
    "ac condenser fan not spinning",
    "ac refrigerant leak symptoms"
  ],
  "Tier 3 – Airflow / Ventilation Issues": [
    "hot air coming from vents",
    "cold air coming from vents in winter",
    "rooms not cooling evenly",
    "one room hotter than others",
    "ac airflow inconsistent",
    "vents barely blowing air",
    "vent whistling noise",
    "vent rattling noise",
    "air duct noise",
    "air duct condensation",
    "air duct mold smell",
    "dust blowing from vents",
    "air vents sweating",
    "air filter clog symptoms",
    "air filter getting dirty quickly"
  ],
  "Tier 4 – Electrical / System Failures": [
    "ac unit not turning off",
    "ac unit randomly shutting off",
    "ac control board failure symptoms",
    "ac relay clicking",
    "ac thermostat wiring issue",
    "ac power loss to thermostat",
    "hvac system not responding",
    "hvac control panel error",
    "hvac unit not powering on",
    "hvac fuse blown",
    "hvac breaker tripping repeatedly",
    "hvac unit overheating",
    "hvac unit vibrating",
    "hvac unit electrical smell",
    "hvac unit burning smell"
  ],
  "Tier 5 – Refrigerant / Cooling Problems": [
    "ac refrigerant leak signs",
    "low refrigerant symptoms",
    "ac blowing room temperature air",
    "ac coil icing up",
    "ac compressor short cycling",
    "ac pressure imbalance",
    "ac condenser overheating",
    "ac suction line freezing",
    "ac refrigerant recharge needed",
    "ac refrigerant smell"
  ],
  "Tier 6 – Drainage / Moisture Problems": [
    "ac drain line clogged",
    "ac drain line leaking",
    "condensate pump not working",
    "ac dripping water inside house",
    "ac water dripping from vent",
    "ac mildew smell",
    "ac mold smell",
    "water in ductwork",
    "ac pan rusting",
    "ac condensation inside unit"
  ],
  "Tier 7 – Heat Pump Problems": [
    "heat pump blowing cold air in heat mode",
    "heat pump not switching modes",
    "heat pump making grinding noise",
    "heat pump short cycling",
    "heat pump fan not spinning",
    "heat pump ice buildup",
    "heat pump thermostat issue",
    "heat pump not defrosting",
    "heat pump low airflow",
    "heat pump compressor failure"
  ],
  "Tier 8 – Furnace / Heating Problems": [
    "furnace blowing cold air",
    "furnace short cycling",
    "furnace making banging noise",
    "furnace igniter not working",
    "furnace pilot light out",
    "furnace overheating",
    "furnace burner not lighting",
    "furnace fan not turning on",
    "furnace thermostat not responding",
    "furnace airflow weak"
  ],
  "Tier 9 – Efficiency / Performance Issues": [
    "ac energy bill suddenly high",
    "ac running constantly but not cooling",
    "ac system losing efficiency",
    "ac cooling slowly",
    "ac cooling unevenly",
    "ac cooling only upstairs",
    "ac cooling only downstairs",
    "ac humidity too high",
    "ac system oversized symptoms",
    "ac system undersized symptoms"
  ],
  "Tier 10 – Miscellaneous Homeowner Problems": [
    "ac smell when first turning on",
    "ac smell after rain",
    "ac smell after cleaning",
    "ac thermostat reading wrong temperature",
    "ac remote not working",
    "smart thermostat losing connection",
    "smart thermostat calibration issue",
    "ac noise when starting",
    "ac noise when stopping",
    "ac unit shaking"
  ]
};

async function seed120Symptoms() {
  console.log('Starting seed for 120 high-value HVAC symptoms...');
  
  let insertedCount = 0;
  
  for (const [tier, symptomsList] of Object.entries(SYMPTOM_TIERS)) {
    console.log(`\nProcessing ${tier}...`);
    
    // Extract base category from the tier name (e.g., "Airflow / Ventilation Issues")
    const categoryName = tier.split(' – ')[1] || 'General';
    
    for (const symptomRaw of symptomsList) {
      // Capitalize first letter of each word
      const name = symptomRaw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const id = toSlug(symptomRaw);
      const description = `Professional diagnostic guide for troubleshooting ${symptomRaw.toLowerCase()}. Discover common causes, repair solutions, and when to call a certified HVAC technician.`;
      
      // Auto-generate some basic query variations for the array
      const queryVariations = JSON.stringify([
        symptomRaw,
        `why is my ${symptomRaw}`,
        `how to fix ${symptomRaw}`,
        `${symptomRaw} troubleshooting`
      ]);
      
      const slug = toSlug(symptomRaw);
      
      try {
        // Check if symptom exists by slug
        const existing = await sql`SELECT id FROM symptoms WHERE slug = ${slug}`;
        
        if (existing.length > 0) {
          await sql`
            UPDATE symptoms 
            SET name = ${name}, 
                description = ${description}, 
                query_variations = ${queryVariations}::jsonb,
                search_intent = 'troubleshooting',
                priority_score = 5
            WHERE id = ${existing[0].id};
          `;
        } else {
          await sql`
            INSERT INTO symptoms (id, name, slug, description, query_variations, search_intent, priority_score)
            VALUES (gen_random_uuid(), ${name}, ${slug}, ${description}, ${queryVariations}::jsonb, 'troubleshooting', 5);
          `;
        }
        insertedCount++;
      } catch (err: any) {
        fs.writeFileSync('error.json', JSON.stringify({ message: err.message, stack: err.stack, code: err.code, name: err.name }, null, 2));
        console.error('Fatal error written to error.json');
        process.exit(1);
      }
    }
  }
  
  console.log(`\n\nSuccessfully seeded/updated ${insertedCount} symptoms in the database.`);
}

seed120Symptoms()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
