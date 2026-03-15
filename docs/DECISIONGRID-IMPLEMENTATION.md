# HVAC Revenue Boost — Knowledge Graph Implementation

HVAC Revenue Boost uses a knowledge graph schema compatible with DecisionGrid for shared data architecture.

## 1. Migration & Schema

**Run migrations:**
```bash
psql $DATABASE_URL -f scripts/migrations/004-decisiongrid-alignment.sql
psql $DATABASE_URL -f scripts/migrations/005-schema-improvements.sql
```

**Migration 005** adds:
- `causes.system_id` — causes can be system-specific (HVAC vs RV vs Marine)
- `confidence_score` on symptom_causes, condition_causes, diagnostic_causes — rank causes by likelihood (1.0 = most likely)

**Seed initial graph:**
```bash
npx tsx scripts/seed-decisiongrid-graph.ts
```

### Core Tables
- `systems` — residential-ac, rv-ac, mini-split, rooftop-hvac
- `symptoms` — ac-not-cooling, ac-blowing-warm-air, etc.
- `conditions` — compressor-running, unit-freezing, etc.
- `diagnostics` — check-refrigerant-pressure, test-ac-capacitor, etc.
- `diagnostic_steps` — wizard flow (question → yes/no → cause)
- `causes` — low-refrigerant, dirty-condenser-coil, bad-capacitor
- `repairs` — recharge-refrigerant, replace-capacitor, etc.
- `components` — ac-capacitor, ac-compressor, ac-contactor

### Junction Tables
- `symptom_conditions`, `symptom_causes`, `condition_causes`
- `condition_diagnostics`, `diagnostic_causes`
- `cause_repairs`, `repair_components`

### Multiplier Tables
- `environment_contexts` — hot-weather, cold-weather, etc.
- `cities` — phoenix, las-vegas, etc.
- `contractors` — linked to cities

---

## 2. Routes

| Route | Page Type |
|-------|-----------|
| `/diagnose/[slug]` | Symptom |
| `/conditions/[slug]` | Condition |
| `/diagnostic/[slug]` | Diagnostic wizard |
| `/cause/[slug]` | Cause |
| `/fix/[slug]` | Repair |
| `/components/[slug]` | Component |
| `/system/[slug]` | System |
| `/repair/[city]/[slug]` | Local service |

---

## 3. Generation Pipeline

**Legacy (full page):**
```bash
npx tsx scripts/generation-worker.ts
```
→ AI generates full JSON → renderToHtml → pages table

**Graph-only:**
```bash
npx tsx scripts/graph-generation-worker.ts
```
→ AI generates graph nodes → upsert into symptoms/causes/repairs → templates render from graph

---

## 4. Related Link Builder

`lib/graph-link-builder.ts` queries junction tables:
- **Symptom** → conditions, diagnostics, causes
- **Cause** → repairs, components
- **Repair** → components, symptoms
- **Condition** → symptoms, causes
- **Component** → repairs

`lib/link-engine.ts` uses graph links first, then related_nodes, then heuristic fallback.

---

## 5. Diagnostic Wizard

- **Component:** `components/DiagnosticWizard.tsx`
- **Route:** `/diagnostic/[slug]`
- **API:** `/api/diagnostic-steps?diagnostic=test-ac-capacitor`
- **Flow:** question → yes/no → next step or cause result → "Get HVAC Repair Help" opens lead modal

---

## 6. Lead Generation

**Form fields:** name, email, phone, zip, system type, issue description, urgency, preferred contact time

**Disclaimer:** "HVAC Revenue Boost connects users with independent service professionals and does not perform repairs."

**Storage:** `leads` table (city_slug, contractor_id when applicable) + GHL webhook

---

## 7. Sitemaps

Master index at `/sitemap.xml` includes:
- sitemaps/systems-index
- sitemaps/symptoms-index
- sitemaps/conditions-index
- sitemaps/diagnostics-index
- sitemaps/causes-index
- sitemaps/repairs-index
- sitemaps/components-index
- sitemaps/cities-index
- sitemaps/local-index

---

## Architecture Flow

```
AI (gpt-4o-mini)
    ↓
Graph Generator / Page Generator
    ↓
Graph Database (symptoms, causes, repairs, etc.)
    ↓
Templates
    ↓
SEO Pages
    ↓
Diagnostic Wizard
    ↓
Service Lead Modal
    ↓
Contractor Leads
```
