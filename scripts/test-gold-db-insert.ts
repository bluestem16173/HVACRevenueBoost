import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import sql from "../lib/db";

const mockPayload = {
  "ai_summary": {
    "bullets": [
      "Most AC cooling failures are caused by airflow restriction or low refrigerant",
      "Start by checking the air filter and thermostat settings",
      "If the outdoor unit is running but air is warm, suspect refrigerant or compressor issues",
      "Weak airflow usually points to a blower or duct problem",
      "Short cycling may indicate thermostat or electrical faults"
    ],
    "most_likely_issue": "Dirty air filter or restricted airflow"
  },

  "system_flow": "flowchart LR\nThermostat --> ControlBoard\nControlBoard --> Compressor\nCompressor --> Condenser\nCondenser --> ExpansionValve\nExpansionValve --> Evaporator\nEvaporator --> Blower\nBlower --> Ducts",

  "diagnostic_flow": "flowchart TD\nA[AC Not Cooling] --> B{Airflow Weak?}\nB -->|Yes| C[Check Filter or Blower]\nB -->|No| D{Outdoor Unit Running?}\nD -->|No| E[Electrical Issue or Capacitor]\nD -->|Yes| F{Air Warm?}\nF -->|Yes| G[Low Refrigerant or Compressor Issue]\nF -->|No| H[System Working Normally]",

  "critical_thresholds": [
    {
      "metric": "Temperature Drop",
      "normal_range": "16-22°F",
      "problem_range": "<12°F"
    },
    {
      "metric": "Airflow",
      "normal_range": "Strong consistent airflow",
      "problem_range": "Weak or uneven airflow"
    }
  ],

  "quick_diagnosis": [
    {
      "symptom": "Weak airflow",
      "likely_cause": "Dirty air filter",
      "action": "Replace filter"
    },
    {
      "symptom": "Warm air blowing",
      "likely_cause": "Low refrigerant",
      "action": "Check for leaks, call technician"
    },
    {
      "symptom": "AC not turning on",
      "likely_cause": "Electrical issue",
      "action": "Check breaker and capacitor"
    },
    {
      "symptom": "Short cycling",
      "likely_cause": "Thermostat issue",
      "action": "Reset or replace thermostat"
    }
  ],

  "causes": [
    {
      "name": "Dirty Air Filter",
      "probability": "High",
      "description": "Clogged filters restrict airflow and reduce cooling efficiency",
      "quick_fix": "Replace filter immediately"
    },
    {
      "name": "Low Refrigerant",
      "probability": "High",
      "description": "Low refrigerant reduces heat absorption, causing warm air",
      "quick_fix": "Check for leaks and recharge system"
    },
    {
      "name": "Bad Capacitor",
      "probability": "Medium",
      "description": "Capacitor failure prevents compressor or fan from starting",
      "quick_fix": "Replace capacitor"
    },
    {
      "name": "Dirty Condenser Coils",
      "probability": "Medium",
      "description": "Outdoor coil buildup prevents heat from being released",
      "quick_fix": "Clean condenser coils"
    },
    {
      "name": "Thermostat Malfunction",
      "probability": "Low",
      "description": "Incorrect signals prevent proper cooling cycles",
      "quick_fix": "Reset or replace thermostat"
    }
  ],

  "deep_causes": [
    {
      "cause": "Dirty Air Filter",
      "why_it_happens": "Dust and debris accumulate over time, restricting airflow across the evaporator coil",
      "fix_steps": [
        "Turn off HVAC system",
        "Locate air filter slot",
        "Remove and inspect filter",
        "Replace with correct size filter",
        "Turn system back on"
      ],
      "tools_needed": ["Replacement filter"]
    },
    {
      "cause": "Low Refrigerant",
      "why_it_happens": "Leaks in refrigerant lines reduce cooling capacity and pressure",
      "fix_steps": [
        "Inspect for visible leaks",
        "Check refrigerant pressure",
        "Seal leak source",
        "Recharge refrigerant to proper levels",
        "Test system performance"
      ],
      "tools_needed": ["Gauge set", "Leak detector"]
    },
    {
      "cause": "Bad Capacitor",
      "why_it_happens": "Electrical wear causes capacitor to fail, preventing startup",
      "fix_steps": [
        "Turn off power",
        "Access capacitor panel",
        "Discharge capacitor safely",
        "Replace with matching unit",
        "Restore power and test"
      ],
      "tools_needed": ["Multimeter", "Screwdriver"]
    },
    {
      "cause": "Dirty Condenser Coils",
      "why_it_happens": "Outdoor debris blocks heat transfer, reducing efficiency",
      "fix_steps": [
        "Turn off power",
        "Remove debris from unit",
        "Spray coil cleaner",
        "Rinse gently with water",
        "Restart system"
      ],
      "tools_needed": ["Coil cleaner", "Hose"]
    }
  ],

  "tools": [
    {
      "name": "Multimeter",
      "purpose": "Test electrical components"
    },
    {
      "name": "Refrigerant Gauge",
      "purpose": "Measure refrigerant pressure"
    },
    {
      "name": "Coil Cleaner",
      "purpose": "Clean condenser coils"
    }
  ],

  "before_calling_tech": [
    "Replace air filter",
    "Check thermostat settings",
    "Ensure breaker is not tripped",
    "Clear debris around outdoor unit"
  ],

  "cost": {
    "low": "$50–$150",
    "medium": "$150–$500",
    "high": "$500–$2000+"
  }
};

async function main() {
  const result = await sql`
    UPDATE pages 
    SET content_json = ${JSON.stringify(mockPayload)}::jsonb,
        schema_version = 'v2_goldstandard'
    WHERE slug = 'ac-not-cooling'
    RETURNING slug;
  `;
  
  if (result.length === 0) {
     console.log("UPDATE failed! No row existed. Inserting new row...");
     await sql`
       INSERT INTO pages (slug, title, page_type, status, content_json, schema_version)
       VALUES (
         'ac-not-cooling', 
         'AC Not Cooling: Complete Diagnostic Guide', 
         'diagnose', 
         'published', 
         ${JSON.stringify(mockPayload)}::jsonb, 
         'v2_goldstandard'
       )
     `;
  }
  console.log("Mock Payload Injected successfully for slug:", result[0]?.slug);
  process.exit(0);
}

main().catch(console.error);
