/**
 * CI gatekeeper: (1) golden HSD locked-body JSON must pass {@link validatePage},
 * (2) alt narrative: {@link assertHardAuthority} + locked → {@link HSDV25Schema} → finalize → render,
 * (3) city publish gate regression for {@link validateHsdCityPublishGate}.
 */
import { createRequire } from "node:module";

import { normalizeHsdInternalLinkPath } from "@/lib/hsd/assertValidInternalLinks";
import { mapLockedHvacNarrativeToHsdV25 } from "@/lib/hsd/mapLockedHvacNarrativeToHsdV25";
import { buildHvacLockedPageForPublish } from "@/lib/hsd/hvacPagePreflight";
import { validateHsdCityPublishGate } from "@/lib/homeservice/validateHsdCityPublishGate";
import { renderHsdV25 } from "@/src/lib/hsd/renderHsdV25";

const require = createRequire(import.meta.url);

/** Add a filename here when you add a new golden under `scripts/fixtures/`. */
const HVAC_GOLDEN_FIXTURES = [
  "ac-not-cooling.json",
  "ac-freezing-up.json",
  "ac-not-cooling-alt-narrative.json",
  "ac-not-turning-on.json",
  "ac-not-turning-on-contactor-buzz.json",
  "ac-short-cycling.json",
  "high-energy-bills.json",
  "weak-airflow.json",
] as const;

function collectInternalLinkPaths(page: Record<string, unknown>): Set<string> {
  const out = new Set<string>();
  const il = page.internal_links;
  if (!il || typeof il !== "object") return out;
  const o = il as Record<string, unknown>;
  for (const key of [
    "related_symptoms",
    "causes",
    "system_pages",
    "repair_guides",
    "context_pages",
  ] as const) {
    const arr = o[key];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (typeof item === "string") {
        const n = normalizeHsdInternalLinkPath(item);
        if (n) out.add(n);
      }
    }
  }
  return out;
}

/** Union of every hub slug referenced across HVAC goldens — used so `internal_links` never point outside the cluster. */
function buildGoldenHvacFixtureLinkGraph(): Set<string> {
  const g = new Set<string>();
  for (const name of HVAC_GOLDEN_FIXTURES) {
    const page = require(`./fixtures/${name}`) as Record<string, unknown>;
    for (const p of collectInternalLinkPaths(page)) g.add(p);
  }
  return g;
}

function runGoldenHsdValidatePage(): void {
  const graphSet = buildGoldenHvacFixtureLinkGraph();
  for (const name of HVAC_GOLDEN_FIXTURES) {
    buildHvacLockedPageForPublish(require(`./fixtures/${name}`) as Record<string, unknown>, {
      graphSet,
      vertical: "HVAC",
    });
    console.log(`PASS: Golden page validated (${name})`);
  }
}

/** Option B path: locked `validatePage` body → {@link HSDV25Schema} shape → publish invariants → HTML. */
function runLockedAltNarrativeToV25Pipeline(): void {
  const graphSet = buildGoldenHvacFixtureLinkGraph();
  const page = buildHvacLockedPageForPublish(
    require("./fixtures/ac-not-cooling-alt-narrative.json") as Record<string, unknown>,
    { graphSet, vertical: "HVAC" },
  );

  const finalized = mapLockedHvacNarrativeToHsdV25(page, {
    slug: "hvac/ac-not-cooling/tampa-fl",
    title: "AC not cooling (Tampa, FL)",
  });
  if (!finalized) {
    console.error("FAIL: mapLockedHvacNarrativeToHsdV25 returned null");
    process.exit(1);
  }
  const html = renderHsdV25({ ...finalized, vertical: "hvac" });
  if (html.length < 2000) {
    console.error("FAIL: renderHsdV25 output unexpectedly short");
    process.exit(1);
  }
  console.log("PASS: locked alt narrative → HSD v2.5 → finalizeHsdV25Page → renderHsdV25");
}

const good = {
  title: "AC Not Cooling in Tampa",
  slug: "hvac/ac-not-cooling/tampa-fl",
  summary_30s:
    "If airflow is fine at registers but supply air stays warm, you are in capacity or refrigeration control territory.",
  how_system_starts: {
    section_title: "How Your AC System Starts (And Why It Fails)",
    eyebrow: "Technical briefing",
    authority_line:
      "AC systems don't fail randomly — they fail in predictable ways based on load, electrical stress, and component wear.",
    startup_sequence: [
      {
        title: "Thermostat calls for cooling",
        detail: "Low-voltage signal leaves the stat when indoor temp is above setpoint.",
      },
      { title: "Contactor pulls in", detail: "Control closes the high-voltage path to the outdoor unit." },
      {
        title: "Capacitor assists start",
        detail: "Start/run assist helps compressor and fan motor come up to speed.",
      },
      { title: "Compressor + fan run", detail: "Refrigerant circulates; outdoor fan rejects heat." },
    ],
    environment_title: "Why failures happen faster in Tampa",
    environment_bullets: [
      "Capacitors age faster when case temps stay high.",
      "Peak demand can show marginal voltage / weak contacts.",
      "High latent load keeps run times long.",
    ],
    mapping_title: "What this means for your issue",
    symptom_mapping: [
      { cue: "No indoor response", points_to: "Thermostat power / low-voltage path" },
      { cue: "Clicking but no start", points_to: "Capacitor or contactor" },
      { cue: "Outdoor silent", points_to: "Disconnect, breaker, or compressor circuit" },
    ],
  },
  quick_decision_tree: [
    {
      situation: "Strong airflow but warm supply",
      leads_to: "Refrigerant or metering",
      anchor: "qdt-warm-supply",
      section_ids: ["section-likely-causes", "section-diagnostic-steps"],
    },
    {
      situation: "Weak airflow at vents",
      leads_to: "Filter, blower, or duct restriction",
      anchor: "qdt-weak-airflow",
      section_ids: ["section-quick-checks", "section-likely-causes"],
    },
    {
      situation: "Outdoor fan not spinning",
      leads_to: "Capacitor, motor, or control",
      anchor: "qdt-outdoor-fan",
      section_ids: ["section-diagnostic-steps", "section-repair-vs-pro"],
    },
  ],
  quick_checks: ["a", "b", "c"],
  likely_causes: ["x", "y", "z"],
  diagnostic_steps: ["1", "2", "3", "4"],
  repair_vs_pro: { diy_ok: ["check filter"], call_pro: ["refrigerant work"] },
  internal_links: {
    parent: "/hvac",
    siblings: ["/a", "/b", "/c"],
    service: "/hvac/ac-repair/tampa-fl",
    authority: "/hvac/how-central-air-conditioning-works",
  },
};

const badMissingSteps = { ...good, diagnostic_steps: ["1", "2"] };

const badHowSystemStarts = { ...good, how_system_starts: {} };

function runCityPublishGateRegression(): void {
  const g = validateHsdCityPublishGate(good);
  const b = validateHsdCityPublishGate(badMissingSteps);
  const h = validateHsdCityPublishGate(badHowSystemStarts);
  if (!g.ok) {
    console.error("FAIL: good payload should pass", g);
    process.exit(1);
  }
  if (b.ok) {
    console.error("FAIL: bad payload should fail");
    process.exit(1);
  }
  if (h.ok) {
    console.error("FAIL: invalid how_system_starts should fail");
    process.exit(1);
  }
  console.log("PASS: validateHsdCityPublishGate regression (good / bad cases)");
  console.log("   errors (expected, truncated steps):", b.errors.join(" | "));
  console.log("   errors (expected, empty how_system_starts):", h.errors.join(" | "));
}

runGoldenHsdValidatePage();
runLockedAltNarrativeToV25Pipeline();
runCityPublishGateRegression();
