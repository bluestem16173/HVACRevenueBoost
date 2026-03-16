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
DATABASE KNOWLEDGE GRAPH (symptoms, conditions, causes, repairs)
        ↓
DETERMINISTIC PAGE BUILDER (buildPageFromGraph)
        ↓
AI ENRICHMENT ONLY (summary, field_note, mermaid, repair_explanations) ~800 tokens
        ↓
PAGE RENDER
        ↓
INDEX

Fallback when graph sparse: Two-stage AI (Pass 1 core + Pass 2 enrichment) ~2000 tokens
```

### Token Cost Comparison

| Mode | Tokens | Use Case |
|------|--------|----------|
| Graph-first + enrichment | ~800 | Symptom has 2+ causes, 2+ repairs in DB |
| Two-stage (Pass 1 + Pass 2) | ~2000 | New topics, sparse graph |
| Legacy full generation | ~3500+ | Deprecated |

### Pipeline

1. **Queue** → Worker fetches `generation_queue`
2. **Graph lookup** → `getSymptomWithCausesFromDB(slug)` for symptom/diagnose pages
3. **If graph sufficient** → `buildPageFromGraph()` + `generateEnrichmentOnly()` → merge
4. **Else** → `generateCoreData()` + `generateEnrichment()` → merge
5. **Render** → `renderToHtml()` → save to `pages`

### Structured Outputs (Schema Enforcement)

- **Pass 1** and **Pass 2** use `response_format: { type: "json_schema", json_schema: { name, strict: true, schema } }` for schema adherence.
- Reduces validation failures and truncation.
- Token budgets by page type: symptom 2000/1200, condition 3200/1400, diagnostic 2600/1200.
- Retry logic: 3 attempts with exponential backoff.

### Canary Batch

After schema changes, run `npm run canary` to generate 7 test pages. Success target: 90%+ first-pass validation.

---

## Scalable Architecture (50k–500k pages)

**Principle:** Store knowledge once, render location pages dynamically.

| Storage | Rows | Example |
|---------|------|---------|
| ❌ Old | 5,000 cities × 200 pages = 1M | tampa-ac-not-cooling, phoenix-ac-not-cooling |
| ✅ New | 200 knowledge pages + 5,000 locations | ac-not-cooling (renders at /tampa/..., /phoenix/...) |

**Page generation:** Only for `symptom`, `condition`, `cause`, `repair`, `diagnostic`, `system`. NOT cities.

**Files:**
- `db/migrations/001_hvac_revenue_boost_schema.sql` — Scalable schema (SERIAL, locations, pages without city)
- `db/migrations/007_page_targets_expansion.sql` — Topic expansion layer (page_targets, page_generation_runs)
- `db/migrations/008_shared_graph_schema.sql` — Shared graph schema (SERIAL, locations)
- `db/migrations/009_align_locations_for_008.sql` — Bridges cities → locations for 008
- `lib/page-targets.ts` — DB helpers: create targets, select pending, store pages, log runs, route leads
- `scripts/seed-hvac-core.ts` — Core graph seed
- `scripts/verify-graph.sql` — Traversal verification
