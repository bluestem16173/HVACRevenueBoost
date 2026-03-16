# Full Code: AC Blowing Warm Air Diagnostic Page

This document contains the complete code for the page at `http://localhost:3000/diagnose/ac-blowing-warm-air`.

---

## 1. Route: `app/diagnose/[slug]/page.tsx`

```tsx
import { SYMPTOMS } from "@/data/knowledge-graph";
import { getDiagnosticSteps, getCauseDetails, getSymptomWithCausesFromDB, getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { getRelatedContent, getInternalLinksForPage } from "@/lib/seo-linking";
import { buildLinksForPage } from "@/lib/link-engine";
import SymptomPageTemplate from "@/templates/symptom-page";
import { notFound } from "next/navigation";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return SYMPTOMS.map((s) => ({ slug: s.id }));
}

export default async function SymptomPage({ params }: { params: { slug: string } }) {
  let symptomData = await getSymptomWithCausesFromDB(params.slug);
  let isFromDB = !!symptomData;

  const aiPage = await getDiagnosticPageFromDB(params.slug) || await getDiagnosticPageFromDB(`diagnose/${params.slug}`);
  const htmlContent = aiPage?.content_json?.html_content || null;
  const contentJson = aiPage?.content_json || null;

  if (!symptomData) {
    symptomData = SYMPTOMS.find((s) => s.id === params.slug) as any;
  }

  const symptom = symptomData as any;

  if (!symptom) {
    notFound();
  }

  const causeDetails = isFromDB
    ? (symptom.causes || [])
    : (symptom.causes || []).map((cId: string) => getCauseDetails(cId)).filter(Boolean);
  const causeIds = causeDetails.map((c: any) => c.slug || c.id);

  const diagnosticSteps = getDiagnosticSteps(causeIds);
  const relatedContent = getRelatedContent(symptomData);
  const internalLinks = await getInternalLinksForPage(params.slug);
  const relatedLinks = await buildLinksForPage("symptom", `diagnose/${params.slug}`, { symptomId: params.slug });

  let tools: any[] = [];
  try {
    const { getToolsFromDB } = require("@/lib/db");
    tools = await getToolsFromDB();
  } catch(e) { /* silent fail */ }

  return (
    <SymptomPageTemplate
      symptom={symptom}
      causeIds={causeIds}
      causeDetails={causeDetails}
      diagnosticSteps={diagnosticSteps}
      relatedContent={relatedContent}
      internalLinks={internalLinks}
      relatedLinks={relatedLinks}
      tools={tools}
      getCauseDetails={getCauseDetails}
      htmlContent={htmlContent}
      contentJson={contentJson}
    />
  );
}
```

---

## 2. Template: `templates/symptom-page.tsx`

The template is ~600 lines. Key structure:

- **Breadcrumbs** — Home / HVAC Systems / Air Conditioning / AC Not Cooling / AC Blowing Warm Air
- **Hero** — Title, description, "Reviewed by Certified HVAC Technicians" badge
- **Technician Statement** — Yellow box, 120–150 words
- **Fast Answer** — Blue-bordered box with likely cause
- **Most Common Fix** — Green-bordered box with cost/difficulty
- **Simple DIY Fixes** — Checklist (thermostat, filter, breaker, condenser)
- **Diagnostic Flowchart** — Mermaid diagram (client-side rendered)
- **Guided Diagnosis Filters** — Environment, Conditions, Noise columns
- **Causes at a Glance** — Top 3 table
- **Common Causes & Possible Fixes** — 3–4 causes with repair cards
- **Repair Difficulty Matrix** — Table
- **Tools Required** — 4 tool cards
- **Components for Fixes** — 4 component cards
- **Typical Repair Costs** — DIY / Moderate / Professional
- **Technician Insights** — 2 quoted insights
- **What Happens If You Ignore This** — Warning box
- **Common DIY Mistakes** — List
- **Environmental Factors** — List
- **Prevention Tips** — 3 tips
- **When to Call a Technician** — Safety warnings
- **Related Diagnostic Guides** — Links
- **Narrow Your Diagnosis** — Environment + conditions
- **Related Problems** — Links
- **Find Local HVAC Repair Help** — CTA
- **FAQ** — 4+ questions

**Full source:** `templates/symptom-page.tsx` in the repo (all 600+ lines)

---

## 3. Knowledge Graph: `data/knowledge-graph.ts` (AC Blowing Warm Air)

```ts
// Symptom entry
{
  id: "ac-blowing-warm-air",
  name: "AC Blowing Warm Air",
  description: "Your air conditioner is running, but the air coming out of the vents is not cold.",
  causes: ["refrigerant-leak", "dirty-coils", "failed-capacitor", "dirty-filter", "welded-contactor", "leaky-ducts"],
}

// Causes used by this symptom
"refrigerant-leak": { id, name: "Low Refrigerant Levels", explanation: "A leak in the refrigerant lines...", component: "refrigerant line", repairs: ["recharge-refrigerant"] }
"failed-capacitor": { id, name: "Blown Start Capacitor", explanation: "The capacitor provides the electrical 'kick'...", component: "capacitor", repairs: ["replace-capacitor"] }
"dirty-coils": { id, name: "Dirty Evaporator Coils", explanation: "Dust buildup on the coils...", component: "evaporator coil", repairs: ["clean-evaporator-coil"] }
"dirty-filter": { id, name: "Severely Clogged Air Filter", ... }
"welded-contactor": { id, name: "Welded AC Contactor", ... }
"leaky-ducts": { id, name: "Leaking Air Ducts", ... }
```

---

## 4. Diagnostic Engine: `lib/diagnostic-engine.ts`

```ts
// getDiagnosticSteps(causeIds) — returns manual steps
// getCauseDetails(causeId) — returns cause + repairDetails from CAUSES/REPAIRS
// getSymptomWithCausesFromDB(slug) — fetches symptom + causes from Neon
// getDiagnosticPageFromDB(slug) — fetches AI-generated page from pages table
```

---

## 5. Conditions: `lib/conditions.ts` (ac-blowing-warm-air)

```ts
// Conditions for this symptom
{ slug: "ac-running-but-not-cooling", symptomId: "ac-blowing-warm-air", causeIds: ["refrigerant-leak", "dirty-coils", "failed-capacitor", "dirty-filter"] }
{ slug: "ac-not-cooling-house-but-unit-running", symptomId: "ac-blowing-warm-air", ... }
{ slug: "ac-not-cooling-after-filter-change", symptomId: "ac-blowing-warm-air", ... }
{ slug: "ac-not-cooling-in-extreme-heat", symptomId: "ac-blowing-warm-air", ... }
{ slug: "ac-not-cooling-upstairs", symptomId: "ac-blowing-warm-air", ... }
```

---

## 6. Clusters: `lib/clusters.ts`

```ts
// ac-blowing-warm-air is in cluster "ac-not-cooling"
{
  slug: "ac-not-cooling",
  name: "AC Not Cooling",
  symptomIds: ["ac-blowing-warm-air", "ice-on-outdoor-unit", "humidity-too-high-home"],
  pillarSlug: "hvac-air-conditioning",
}
```

---

## 7. Tailwind Colors: `tailwind.config.ts`

```ts
colors: {
  hvac: {
    navy: "#0a192f",
    blue: "#1e3a8a",
    gold: "#d4af37",
    safety: "#e53e3e",
    brown: "#6B5344",
    "brown-warm": "#A0522D",
  },
}
```

---

## 8. Components Used

- **MermaidDiagram** — `components/MermaidDiagram.tsx` (client, `ssr: false`)
- **DiyDifficultyMeter** — `components/DiyDifficultyMeter.tsx`

---

## File Map

| File | Purpose |
|------|---------|
| `app/diagnose/[slug]/page.tsx` | Route handler, data fetching |
| `templates/symptom-page.tsx` | Full page template |
| `data/knowledge-graph.ts` | SYMPTOMS, CAUSES, REPAIRS |
| `lib/diagnostic-engine.ts` | getDiagnosticSteps, getCauseDetails, DB helpers |
| `lib/conditions.ts` | getConditionsForSymptom |
| `lib/clusters.ts` | getClusterForSymptom |
| `lib/seo-linking.ts` | getRelatedContent, getInternalLinksForPage |
| `lib/link-engine.ts` | buildLinksForPage |
| `components/MermaidDiagram.tsx` | Flowchart renderer |
| `components/DiyDifficultyMeter.tsx` | DIY difficulty UI |

---

## Data Flow

1. User visits `/diagnose/ac-blowing-warm-air`
2. `page.tsx` loads symptom from DB or `SYMPTOMS` in knowledge-graph
3. Causes come from DB `symptom_causes` or `symptom.causes` → `getCauseDetails`
4. Repairs come from `cause_repairs` or `REPAIRS` in knowledge-graph
5. `SymptomPageTemplate` receives symptom, causes, diagnostic steps, related links
6. Template renders all sections with fallbacks when `contentJson` (AI) is missing
