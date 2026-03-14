/**
 * Seed diagnostic_tests and cause_diagnostic_tests
 * Maps technician testing procedures to causes.
 */

import sql from "../lib/db";

const DIAGNOSTIC_TESTS = [
  {
    name: "Measure Static Pressure",
    slug: "measure-static-pressure",
    description: "Measures airflow restriction in HVAC duct system",
    test_steps: [
      "Locate test ports near air handler",
      "Insert manometer probes",
      "Measure supply and return pressure",
      "Compare total static pressure to manufacturer limits",
    ],
    tools_required: ["manometer", "drill", "static pressure probes"],
  },
  {
    name: "Measure Blower Amperage",
    slug: "measure-blower-amperage",
    description: "Checks blower motor electrical draw under load",
    test_steps: [
      "Set system to cooling/heating mode",
      "Clamp ammeter on blower motor lead",
      "Compare reading to nameplate FLA",
      "High amperage indicates restriction or motor failure",
    ],
    tools_required: ["clamp ammeter", "multimeter"],
  },
  {
    name: "Test Capacitor Microfarads",
    slug: "test-capacitor-microfarads",
    description: "Verifies start/run capacitor capacitance",
    test_steps: [
      "Disconnect power and discharge capacitor",
      "Set multimeter to capacitance mode",
      "Measure across capacitor terminals",
      "Compare to nameplate rating (±6% tolerance)",
    ],
    tools_required: ["multimeter", "capacitor discharge tool"],
  },
  {
    name: "Verify Fan RPM",
    slug: "verify-fan-rpm",
    description: "Checks blower or condenser fan speed",
    test_steps: [
      "Use tachometer or strobe on fan blade",
      "Compare to manufacturer spec",
      "Low RPM indicates capacitor or motor issue",
    ],
    tools_required: ["tachometer", "strobe light"],
  },
  {
    name: "Inspect Evaporator Coil",
    slug: "inspect-evaporator-coil",
    description: "Visual and delta-T check of indoor coil",
    test_steps: [
      "Remove evaporator access panel",
      "Inspect coil surface for dust or ice",
      "Measure temperature delta across coil",
      "Check for airflow restriction",
    ],
    tools_required: ["thermometer", "inspection mirror"],
  },
  {
    name: "Check Subcooling and Superheat",
    slug: "check-subcooling-superheat",
    description: "Refrigerant charge verification",
    test_steps: [
      "Attach gauges to service ports",
      "Read suction and liquid line pressures",
      "Measure line temperatures",
      "Calculate superheat and subcooling per manufacturer chart",
    ],
    tools_required: ["manifold gauges", "temperature clamps", "PT chart"],
  },
  {
    name: "Leak Test with Nitrogen",
    slug: "leak-test-nitrogen",
    description: "Pressurizes system to locate refrigerant leaks",
    test_steps: [
      "Recover refrigerant if system has charge",
      "Pressurize with nitrogen to test pressure",
      "Hold and monitor pressure drop",
      "Use soap bubbles or electronic leak detector on fittings",
    ],
    tools_required: ["nitrogen tank", "regulator", "leak detector"],
  },
  {
    name: "Check 24V at Thermostat",
    slug: "check-24v-thermostat",
    description: "Verifies low-voltage circuit from transformer",
    test_steps: [
      "Remove thermostat from wall",
      "Measure voltage between R and C terminals",
      "Verify 24VAC present",
      "Check R to Y, G, W when calling for cooling/heating",
    ],
    tools_required: ["multimeter"],
  },
  {
    name: "Ohm Test Contactor",
    slug: "ohm-test-contactor",
    description: "Tests contactor coil and contact continuity",
    test_steps: [
      "Disconnect power",
      "Ohm test across coil terminals",
      "Ohm test across contact points (open and closed)",
      "Check for pitting or welding",
    ],
    tools_required: ["multimeter"],
  },
  {
    name: "Inspect Flame Sensor",
    slug: "inspect-flame-sensor",
    description: "Checks furnace flame rectification signal",
    test_steps: [
      "Remove flame sensor",
      "Inspect for oxidation or soot",
      "Clean with steel wool if needed",
      "Measure microamp reading during flame",
    ],
    tools_required: ["multimeter", "steel wool"],
  },
  {
    name: "Visual Attic Duct Inspection",
    slug: "visual-duct-inspection",
    description: "Checks ductwork for collapse or disconnection",
    test_steps: [
      "Access attic or crawl space",
      "Trace supply ducts from air handler",
      "Look for collapsed flex, disconnected joints",
      "Check for kinks or crushing",
    ],
    tools_required: ["flashlight", "inspection mirror"],
  },
  {
    name: "Smoke Leak Test",
    slug: "smoke-leak-test",
    description: "Visualizes duct leakage with smoke or fog",
    test_steps: [
      "Seal return and supply",
      "Introduce smoke or fog into duct system",
      "Observe leaks at joints and seams",
      "Mark locations for sealing",
    ],
    tools_required: ["duct blaster", "smoke pencil"],
  },
];

// Cause slug -> diagnostic test slugs (matches knowledge graph + seed-neon causes)
const CAUSE_TO_TESTS: Record<string, string[]> = {
  "dirty-filter": ["measure-static-pressure", "inspect-evaporator-coil"],
  "leaky-ducts": ["measure-static-pressure", "visual-duct-inspection", "smoke-leak-test"],
  "dirty-coils": ["inspect-evaporator-coil", "measure-static-pressure"],
  "failed-capacitor": ["test-capacitor-microfarads"],
  "refrigerant-leak": ["check-subcooling-superheat", "leak-test-nitrogen"],
  "faulty-thermostat": ["check-24v-thermostat"],
  "welded-contactor": ["ohm-test-contactor"],
  "dirty-flame-sensor": ["inspect-flame-sensor"],
  "worn-igniter": ["check-24v-thermostat"],
  "clogged-drain": ["inspect-evaporator-coil"],
  "bad-defrost-board": ["check-24v-thermostat"],
  "stuck-reversing-valve": ["check-subcooling-superheat", "ohm-test-contactor"],
};

async function seed() {
  console.log("🔧 Seeding diagnostic_tests...");

  const testIds: Record<string, string> = {};

  for (const test of DIAGNOSTIC_TESTS) {
    const res = await sql`
      INSERT INTO diagnostic_tests (name, slug, description, test_steps, tools_required)
      VALUES (
        ${test.name},
        ${test.slug},
        ${test.description},
        ${JSON.stringify(test.test_steps)},
        ${test.tools_required}
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        test_steps = EXCLUDED.test_steps,
        tools_required = EXCLUDED.tools_required
      RETURNING id
    `;
    testIds[test.slug] = res[0].id;
  }

  console.log(`✅ Inserted/updated ${DIAGNOSTIC_TESTS.length} diagnostic tests`);

  // Fetch causes by slug (from DB or we need to handle static KG)
  const causes = await sql`SELECT id, slug FROM causes`;
  const causeBySlug = Object.fromEntries(causes.map((c: any) => [c.slug, c.id]));

  console.log("🔗 Linking causes to diagnostic tests...");

  let linkCount = 0;
  for (const [causeSlug, testSlugs] of Object.entries(CAUSE_TO_TESTS)) {
    const causeId = causeBySlug[causeSlug];
    if (!causeId) continue;

    for (const testSlug of testSlugs) {
      const testId = testIds[testSlug];
      if (!testId) continue;

      try {
        await sql`
          INSERT INTO cause_diagnostic_tests (cause_id, test_id)
          VALUES (${causeId}, ${testId})
          ON CONFLICT (cause_id, test_id) DO NOTHING
        `;
        linkCount++;
      } catch (e) {
        // Ignore duplicate or FK errors
      }
    }
  }

  console.log(`✅ Linked ${linkCount} cause-test relationships`);
  console.log("🏁 Seed complete.");
}

seed().catch(console.error);
