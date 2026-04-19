import EmergencyPageTemplate, { EmergencySchema } from "@/templates/emergency-page";
import { getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { FLORIDA_CITIES } from "@/lib/locations";
import { permanentRedirect } from "next/navigation";
import { Metadata } from "next";
import { strictRobotsForDbPage } from "@/lib/seo/strict-indexing";
import { SYMPTOMS } from "@/data/knowledge-graph";

export const revalidate = 3600;

// HELPER: Format strings cleanly
const formatSymptom = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
const formatCity = (c: string) => c.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

// HELPER: Validate slug against known entities to avoid junk URLs indexing
const isValidSymptom = (slug: string) => {
  return SYMPTOMS.some(s => s.id === slug) || ['ac-not-working', 'heater-blowing-cold', 'water-leaking-from-ac'].includes(slug);
};

// HELPER: Generate Mermaid graph
function getMermaidFlow(symptom: string): string {
  const name = formatSymptom(symptom);
  return `flowchart TD
    A[${name}] --> B{Thermostat set to COOL?}
    B -- No --> B1[Set thermostat correctly]
    B -- Yes --> C{Air filter dirty?}
    C -- Yes --> C1[Replace filter]
    C -- No --> D{Outdoor unit running?}
    D -- No --> D1[Check breaker or disconnect]
    D -- Yes --> E{Blowing warm air?}
    E -- Yes --> F[Likely capacitor or refrigerant issue]
    E -- No --> G[System may be functioning normally]

    F --> H[Still not fixed? Call HVAC technician]
    D1 --> H`;
}

// PROGRAMMATIC SEO: Minimum viable fallback that ALWAYS renders even if DB is unhydrated
function getFallbackEmergencyData(city: string, symptom: string): EmergencySchema {
  return {
    bannerHeadline: `${formatSymptom(symptom)} in ${formatCity(city)}? Try This First`,
    dangerLine: "This issue may indicate airflow restriction, electrical failure, or component breakdown.",

    immediateChecks: [
      "Check thermostat is set to COOL and below room temperature",
      "Replace or inspect air filter",
      "Check breaker and outdoor disconnect"
    ],

    fix60Title: "Fix in 60 Seconds",
    fix60Steps: [
      "Reset thermostat",
      "Turn system off for 5 minutes, then restart",
      "Inspect filter and vents"
    ],

    mermaidFlow: getMermaidFlow(symptom),

    mostLikelyTitle: "Most Likely Fix",
    mostLikelyFix: "In many cases, this issue is caused by a failed capacitor, clogged airflow, or thermostat misconfiguration.",

    costBand: "$150–$600",
    difficulty: "Moderate",
    timeEstimate: "1–2 hours",

    monetizationHeadline: `Need Help in ${formatCity(city)}?`,
    monetizationBullets: [
      "Local licensed HVAC technicians",
      "Same-day service available",
      "Upfront pricing and diagnostics"
    ],

    leadStyle: "soft"
  };
}

// ==========================================
// METADATA (SEO Consolidation Layer)
// ==========================================
export async function generateMetadata({ params }: { params: { city: string, symptom: string } }): Promise<Metadata> {
  // STATE 3: Invalid -> Will redirect, so metadata doesn't matter
  if (!isValidSymptom(params.symptom) || !FLORIDA_CITIES.find(c => c.slug === params.city)) {
    return {};
  }

  const page = await getDiagnosticPageFromDB(params.symptom, 'emergency', params.city);
  const isThin = !page || !page.content_json || page.quality_status === "needs_regen";

  const generatedSeo = page?.content_json?.seo;

  // STATE 1 & 2: Canonical Strategy
  // If Thin (STATE 2): Roll up authority to parent symptom hub.
  // If Full (STATE 1): Self-canonical + AI SEO Metadata.
  const baseRobots = { index: !isThin, follow: true as const };
  const strict = strictRobotsForDbPage(!isThin, page?.updated_at);

  return {
    title: generatedSeo?.title || `24/7 HVAC Emergency in ${formatCity(params.city)} | Fix It Today`,
    description: generatedSeo?.meta_description || `Same-day emergency HVAC repair in ${formatCity(params.city)}. We diagnose and fix it fast.`,
    alternates: {
      canonical: isThin
        ? `https://www.hvacrevenueboost.com/repair/${params.symptom}`
        : `https://www.hvacrevenueboost.com/emergency/${params.city}/${params.symptom}`
    },
    robots: strict?.robots ?? baseRobots,
  };
}

export async function generateStaticParams() {
  const combinations = [];
  const topCities = FLORIDA_CITIES.slice(0, 5); 
  const topEmergencies = ['ac-not-working', 'heater-blowing-cold', 'water-leaking-from-ac'];

  for (const city of topCities) {
    for (const emergency of topEmergencies) {
      combinations.push({ city: city.slug, symptom: emergency });
    }
  }
  return combinations;
}

// ==========================================
// RENDER COMPONENT
// ==========================================
export default async function EmergencyRoute({ params }: { params: { city: string, symptom: string } }) {
  const cityObj = FLORIDA_CITIES.find(c => c.slug === params.city);
  
  // STATE 3: Truly Invalid URL (Garbage slug) -> Consolidate to /repair via 301
  if (!cityObj || !isValidSymptom(params.symptom)) {
    permanentRedirect('/repair');
  }

  // STATE 1 & 2: Valid slug path
  const aiPage = await getDiagnosticPageFromDB(params.symptom, 'emergency', params.city);
  const isThin = !aiPage || !aiPage.content_json || aiPage.quality_status === "needs_regen";

  let data: EmergencySchema;

  if (isThin) {
    // STATE 2: Valid, but thin. Render minimal SEO page.
    data = getFallbackEmergencyData(params.city, params.symptom);
  } else {
    // STATE 1: Data exists in DB. Use it.
    data = aiPage.content_json as unknown as EmergencySchema;
  }

  return <EmergencyPageTemplate data={data} city={cityObj.name} />;
}
