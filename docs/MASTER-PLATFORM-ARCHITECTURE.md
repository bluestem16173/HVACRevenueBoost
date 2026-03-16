# Master Platform Architecture

Programmatic SEO + Diagnostic Knowledge Graph + Lead Marketplace for DecisionGrid + HVAC Revenue Boost.

## Quick Start

```bash
# 1. Run migration (idempotent)
npm run db:master-migrate

# 2. Seed HVAC graph
npm run db:master-seed

# 3. Verify
npm run db:master-verify
```

## Architecture Overview

### 8 Layers

| Layer | Purpose |
|-------|---------|
| 1. Diagnostic Knowledge Graph | systems → symptoms → conditions → causes → repairs → components |
| 2. Local SEO | locations, contractors, contractor_locations, contractor_services |
| 3. Content Generation | page_targets, pages, page_generation_runs |
| 4. Leads | leads (references pages, contractors, locations) |
| 5. Programmatic SEO | page_patterns, snowball_expansions, expansion_queue, pattern_expansion_logs |
| 6. Authority Clusters | topic_clusters, cluster_pages |
| 7. Internal Link Authority | page_links, link_rules, link_graph |
| 8. SEO Intelligence | gsc_queries, gsc_page_metrics, keyword_opportunities, serp_competitors, content_gaps, index_status |
| 9. Analytics | page_views, lead_events, ai_usage_logs, weekly_site_reports, weekly_contractor_reports, traffic_forecasts |

### Content Quality Rules

- Minimum 3 causes per page
- Minimum 5 repair options
- Minimum 5 FAQs
- Structured JSON: fast_answer, technical_explanation, diagnostic_tree, causes, repairs, components, tools_required, cost_estimates, field_notes, prevention_tips, faq

### City SEO Rule

**Knowledge content is global.** City URLs share one content row.

- `/ac-not-cooling-outdoor-unit-running` (canonical)
- `/tampa/ac-not-cooling-outdoor-unit-running` (location variant)
- `/phoenix/ac-not-cooling-outdoor-unit-running` (location variant)

One `pages` row, multiple URL patterns.

## Files

| File | Purpose |
|------|---------|
| `db/migrations/001_master_platform_schema.sql` | All tables, indexes, constraints, triggers |
| `scripts/seed_hvac_graph.sql` | Systems, symptoms, conditions, causes, repairs, components + junctions |
| `scripts/verify_platform.sql` | Graph traversal, page targets, generation, leads, GSC, clusters |
| `scripts/run-master-migration.ts` | Runner (loads .env.local, executes SQL) |

## Idempotency

- `CREATE TABLE IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`
- Never drops tables
- Seed uses `ON CONFLICT DO NOTHING`

## Existing Databases

If you have an existing schema (e.g. from migration 008), the master migration will skip existing tables. New tables (page_patterns, snowball_expansions, etc.) will be created. For full alignment with existing UUID-based schemas, run the appropriate bridge migrations first.
