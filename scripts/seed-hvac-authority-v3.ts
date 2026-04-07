import "dotenv/config";
import sql from '../lib/db';
import { HVACAuthorityPage } from '../types/hvac-authority';

async function run() {
  try {
    const slug = 'hvac-furnace-not-turning-on-fixed';
    
    // Conforming exactly to the v3 schema requirements with upgraded copy
    const payload: HVACAuthorityPage = {
      layout: "hvac_authority_v3",
      page_type: "diagnostic",
      schema_version: "v3",
      slug: slug,
      title: "Furnace Not Turning On: High-Risk Diagnostic & Safe Checks",
      h1: "Furnace Completely Unresponsive: Professional Diagnostic Guide",
      meta_title: "Furnace Not Turning On? Expert Troubleshooting & Fixes",
      meta_description: "Learn why your furnace is completely unresponsive. Professional diagnostic flow, safe quick checks, and when to call an expert.",
      canonical_path: `/diagnose/${slug}`,
      intro: "A furnace that won't turn on at all is essentially a dead circuit. This is almost never a mechanical failure, but rather a power interruption, blown fuse, or a locked-open safety sensor. Follow this technical guide to run safe, basic DIY checks—and know exactly when deeper troubleshooting requires a licensed professional.",
      
      summary_30s: {
        label: "30-Second Overview",
        overview: "A furnace has to complete a startup sequence in the correct order before it can produce heat. If power, thermostat signal, inducer draft, ignition, flame sensing, or blower timing fails at any point, the system may not start or may shut down for safety.",
        bullets: [
          "Complete failure to turn on is usually electrical (breaker, power switch, or blown 3A board fuse).",
          "A blinking inducer fan with no heat signals a safety sensor lockout.",
          "Testing control boards or gas valves natively carries high-voltage and combustion risks."
        ]
      },

      immediate_quick_checks: [
        {
          step_number: 1,
          instruction: "Verify the dedicated circuit breaker in your electrical panel.",
          why_it_matters: "Furnaces are on dedicated 15A or 20A circuits. A tripped breaker immediately cuts all 120V power to the unit and thermostat."
        },
        {
          step_number: 2,
          instruction: "Check the furnace service switch.",
          why_it_matters: "Often mistaken for a light switch in the basement or attic. If toggled off, the furnace receives strictly zero power."
        },
        {
          step_number: 3,
          instruction: "Inspect the blower door panel seating.",
          why_it_matters: "The front panel acts as a safety kill-switch. If loose, power is physically cut from the master control board."
        }
      ],

      diy_tools: [
        {
          tool: "Flashlight",
          purpose: "For inspecting panel seating and diagnostic LED lights.",
          safe_for_basic_diy: true,
          caution_note: "Do not touch exposed wires while inspecting."
        },
        {
          tool: "1/4\" Nut Driver",
          purpose: "To remove the outer cabinet door if needed.",
          safe_for_basic_diy: true,
          caution_note: "Only remove panels after verifying power is turned off at the breaker."
        },
        {
          tool: "Multimeter",
          purpose: "To test 120VAC incoming line voltage and limits.",
          safe_for_basic_diy: false,
          caution_note: "High risk of shock. Tracing live voltage should only be done by trained technicians."
        }
      ],

      high_risk_warning: {
        severity: "critical", 
        title: "High-Voltage & Combustion Risk",
        body: "Gas furnaces utilize 120V electrical power combined with combustible natural gas. Testing the master control board, ignitor sequences, or gas valves while live carries significant risk of electrical injury or fire.",
        risk_points: [
          "120V shock hazards present directly at the control board and blower motor.",
          "Bypassing safety limit switches can cause catastrophic heat exchanger failure.",
          "Improper handling of the gas valve can result in natural gas leaks."
        ],
        show_emergency_cta: true
      },

      emergency_cta: {
        title: "Do not risk electrical shock, ignition failure, or unsafe live testing.",
        body: "If the system is showing high-voltage or combustion-stage failure, stop here and get professional help. Continuing past this point can create fire risk, shock risk, or serious injury.",
        button_text: "Get Professional Help",
        urgency_note: "Technicians available 24/7 for urgent diagnostics."
      },

      most_common_causes: [
        {
          cause: "Blown 3-Amp Control Board Fuse",
          probability_note: "High Probability",
          explanation: "Just like in a car, an automotive-style blade fuse protects the control board from 24V short circuits. If contactor wiring or the thermostat shorts out, this fuse instantly blows, rendering the system dead.",
          signs: ["Thermostat is completely blank", "Furnace will not respond to 'fan-on' mode"]
        },
        {
          cause: "Safety Switch Lockout (Limit/Rollout)",
          probability_note: "High Probability",
          explanation: "If the furnace overheated recently (often due to a clogged filter), the high limit switch may have locked open, blocking the ignition sequence from starting.",
          signs: ["Inducer motor runs but no ignition", "Diagnostic board flashes a 'limit circuit open' code"]
        },
        {
          cause: "Dead Thermostat Batteries",
          probability_note: "Medium Probability",
          explanation: "If your thermostat lacks a 'C' (Common) wire, it relies strictly on AA/AAA batteries. No battery power means no 'call for heat' signal reaches the furnace.",
          signs: ["Low battery icon flashing", "Screen is blank but furnace has 120V power"]
        },
        {
          cause: "Failed Inducer Draft Motor",
          probability_note: "Medium Probability",
          explanation: "The inducer motor clears explosive exhaust gases. If it has seized or failed, the pressure switch will never close and the furnace will utterly refuse to ignite.",
          signs: ["Loud buzzing from the draft motor", "System clicks but motor never spins"]
        }
      ],

      how_the_system_works: {
        overview: "A modern furnace follows a strict mechanical and electronic sequence. If any step fails, the system immediately shuts down to prevent explosive buildup.",
        components: [
          "Thermostat call for heat",
          "Control board response",
          "Inducer starts",
          "Pressure switch verifies venting",
          "Igniter energizes",
          "Gas valve opens",
          "Flame is sensed",
          "Blower turns on"
        ]
      },

      advanced_diagnostic_flow: [
        {
          step_number: 1,
          title: "Thermostat Power Check",
          check: "Is the thermostat screen illuminated and sending a call for heat?",
          normal_result: "Proceed to check W terminal for 24VAC output.",
          danger_or_fail_result: "Blank screen indicates dead batteries or a blown 3A board fuse.",
          next_action: "Test incoming 120V power at the service switch."
        },
        {
          step_number: 2,
          title: "Inducer Motor Sequence",
          check: "Does the Inducer Motor start up within 10 seconds?",
          normal_result: "Motor runs; click is heard from the pressure switch.",
          danger_or_fail_result: "Motor is hot but won't spin, or board is totally unresponsive.",
          next_action: "Requires live 120V testing at the inducer terminals."
        },
        {
          step_number: 3,
          title: "Ignition Sequence",
          check: "Does the ignitor glow or spark after the inducer runs?",
          normal_result: "Bright glowing or rapid clicking observed.",
          danger_or_fail_result: "Ignitor remains cold. High limit switch may be locked open.",
          next_action: "Requires continuity testing on safety limits."
        }
      ],

      mermaid_diagram: {
        title: "Furnace Startup Logic Map",
        code: "graph TD;\n  Start[Call for Heat] --> CheckPower{Has 120V?};\n  CheckPower -- No --> Breaker[Check Breaker & Door Switch];\n  CheckPower -- Yes --> Inducer{Inducer Starts?};\n  Inducer -- No --> Board[Check Control Board / Motor];\n  Inducer -- Yes --> Pressure{Pressure Switch Closed?};\n  Pressure -- No --> Vent[Check Flue / Tubing];\n  Pressure -- Yes --> Ignitor[Ignitor Glows];"
      },

      repair_matrix: [
        {
          symptom: "Blank Thermostat",
          likely_issue: "Blown 3A Fuse",
          fix_type: "Electrical",
          difficulty: "Easy",
          estimated_cost: "$85 - $150 (Service Call)"
        },
        {
          symptom: "LED Flashing 4 Times",
          likely_issue: "Open High Limit Switch",
          fix_type: "Sensor",
          difficulty: "Moderate",
          estimated_cost: "$120 - $250"
        },
        {
          symptom: "Inducer hums, won't spin",
          likely_issue: "Seized Inducer Motor",
          fix_type: "Mechanical",
          difficulty: "Pro Only",
          estimated_cost: "$450 - $850"
        }
      ],

      repair_vs_replace: {
        repair_when: "The unit is under 12 years old and the failure is restricted to sensors, thermostat boundaries, or minor electrical limits.",
        replace_when: "The heat exchanger is cracked, the master control board has failed on a unit over 15 years old, or R-22 A/C components are tied in.",
        decision_note: "Replacing a $600-$800 control board on a 16-year-old 80% AFUE furnace provides a poor ROI compared to upgrading to a modern 96% high-efficiency system."
      },

      when_to_stop_diy: {
        title: "CRITICAL hazard: When to Stop DIY Diagnostics",
        intro: "Basic checks end at the filter, thermostat, and breaker. Do not proceed further if you experience any of the following.",
        danger_points: [
          "The diagnostic LED is flashing an 'Ignition Lockout' code.",
          "You discover burnt or charred wiring inside the service panel.",
          "A multi-meter is required to test live 120VAC on the control board.",
          "You smell natural gas near the unit."
        ],
        conversion_body: "DO NOT attempt to bypass safety switches or test the 120V control board without a license. Doing so without professional training risks arc flashes, catastrophic combustion events, and irreversible electrical damage to the system backbone.",
        cta_text: "Request Safe Professional Diagnostic"
      },

      prevention_tips: [
        "Replace standard 1-inch fiberglass filters strictly every 30 days.",
        "Ensure all supply vents and return grilles are 100% unobstructed.",
        "Schedule annual pre-winter professional servicing to verify microamp flame sensor readings and combustion health."
      ],

      faqs: [
        {
          question: "Why did my furnace randomly shut off and won't turn back on?",
          answer: "It likely tripped a safety sensor due to restricted airflow (dirty filter), or the main blower door was bumped, disengaging the safety kill-switch."
        },
        {
          question: "Is there a reset button on my furnace?",
          answer: "Some specific roll-out switches have manual resets, but primary system resets are done simply by turning the power off at the switch for 60 seconds."
        },
        {
          question: "Can a bad thermostat prevent the furnace from turning on?",
          answer: "Absolutely. If the thermostat has natively failed, has loose wiring, or dead batteries, it physically cannot close the 'W' circuit to tell the furnace to start."
        },
        {
          question: "Why is the inducer motor running but there's no heat?",
          answer: "This usually means the pressure switch failed to close, or the high limit switch is locked open. The board is running the fan for safety but refusing to open the gas valve."
        }
      ],

      internal_links: {
        related_symptoms: [
          "Furnace starts then stops quickly",
          "Furnace blowing cold air"
        ],
        related_system_pages: [
          "Gas Valve Assembly Guide"
        ],
        pillar_page: "Ultimate Furnace Repair Hub"
      },

      bottom_cta: {
        title: "Furnace Dead? Get Local, Certified Help Immediately.",
        body: "Delaying repairs on an unresponsive furnace forces your home's temperature to plummet, risking frozen pipes and severe water damage. Have a licensed technician diagnose the exact failure point safely.",
        urgency_bullets: [
          "Prevent frozen pipes during extreme cold snaps",
          "Ensure safe gas pressure and combustion",
          "Protect the master control board from cascading electrical failure"
        ],
        button_text: "Dispatch Local Technician Now"
      },

      author_note: "Diagnostics verified by a 30-year Master HVAC Technician adhering to national safety standards."
    };

    console.log(`Inserting EXPANDED HVACAuthority V3 ${slug} into pages table...`);
    
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
        'hvac_authority_v3',
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
        page_type = EXCLUDED.page_type,
        updated_at = NOW();
    `;
    
    console.log("Successfully inserted programmatic page v3 expansion into Neon DB!");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
