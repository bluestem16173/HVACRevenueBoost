import "dotenv/config";
import sql from '../lib/db';

async function run() {
  try {
    const slug = 'hvac-furnace-not-turning-on-fixed';
    
    const payload = {
      "layout": "dg_authority_v2",
      "schemaVersion": "v1",
      "summary_30s": {
        "bullets": [
          "Furnace is completely unresponsive and failing to start",
          "Usually caused by a tripped circuit breaker, blown fuse, or faulty thermostat",
          "Check power sources, thermostat settings, and pilot light/ignition first"
        ]
      },
      "troubleshooting_steps": [
        "Verify circuit breaker has not tripped",
        "Check thermostat batteries and heating settings",
        "Inspect furnace power switch and front panel door switch",
        "Check pilot light or electronic ignition sensor"
      ],
      "causes": [
        {
          "name": "Tripped Breaker or Blown Fuse",
          "symptoms": ["Thermostat is blank", "No sounds from furnace"],
          "why": "Power surge or overloaded circuit cuts electricity to the entire unit",
          "if_ignored": "No heat all winter; possible electrical damage",
          "cost": "$0 - $25"
        },
        {
          "name": "Faulty Thermostat",
          "symptoms": ["Screen blank", "Set temperature not matching room", "Clicking sound but no heat"],
          "why": "Thermostat is unable to send the heating signal to the furnace control board",
          "if_ignored": "Inconsistent heating or complete system shutdown",
          "cost": "$50 - $250"
        },
        {
          "name": "Dirty Flame Sensor or Ignitor",
          "symptoms": ["Furnace clicks but won't ignite", "Starts then stops running after a few seconds"],
          "why": "Carbon buildup prevents the unit from detecting the flame, causing safety shutoff",
          "if_ignored": "Furnace will remain locked out for safety reasons",
          "cost": "$100 - $300"
        }
      ],
      "repair_vs_replace": "Repair if issue is a simple sensor, fuse, or thermostat. Replace the furnace if the heat exchanger is cracked or the unit is past its 15-20 year lifespan.",
      "internal_links": {},
      "cta": {
        "primary_href": "/contact",
        "primary_label": "Fix Furnace Now"
      }
    };

    console.log(`Inserting ${slug} into pages table...`);
    
    await sql`
      INSERT INTO pages (
        slug,
        page_type,
        schema_version,
        status,
        content_json,
        created_at,
        updated_at
      )
      VALUES (
        ${slug},
        'dg_authority_v2',
        'v1',
        'published',
        ${JSON.stringify(payload)}::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT (slug)
      DO UPDATE SET
        content_json = EXCLUDED.content_json,
        schema_version = EXCLUDED.schema_version,
        updated_at = NOW();
    `;
    
    console.log("Successfully inserted programmatic page expansion into Neon DB!");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
