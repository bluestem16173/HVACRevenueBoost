# Migration 010 — Verification Checklist

After running `npm run db:migrate-010`, verify the following.

## Workers

| Check | Command / Action |
|-------|------------------|
| generation-worker can read generation_queue | `npx tsx scripts/generation-worker.ts` (or queue items first) |
| city-generator can read cities | `node scripts/city-generator.js` (requires cities + symptoms) |
| graph generation uses components, related_nodes | `npx tsx scripts/build-related-graph.ts` |

## APIs

| Check | Endpoint / Action |
|-------|-------------------|
| diagnostic-steps API reads diagnostics | `GET /api/diagnostic-steps?diagnostic=<slug>` |
| diagnostic-steps API reads diagnostic_steps | Same; returns steps when diagnostic exists |
| lead API reads cities | `POST /api/lead` with city in body |
| getToolsFromDB | Any page that fetches tools |

## SEO / Linking

| Check | Action |
|-------|--------|
| internal_links read/write | `getInternalLinksForPage(slug)`, `getGlobalPillarLinks()` |
| related_nodes read | `buildLinksForPage()` → link-engine |
| build-links script | `node scripts/build-links.js` |

## DB Safety

- [x] Migration is idempotent (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`)
- [x] No `DROP TABLE` or destructive changes
- [x] Indexes on slug, status, and relationship columns

## Tables Added (010)

- generation_queue
- diagnostics
- diagnostic_steps
- cities
- tools
- components
- internal_links
- related_nodes
- environments
- vehicle_models
- parts
- diagnostic_paths
- link_graph
- cause_components
- condition_diagnostics
- repair_components

## Leads Compatibility

Leads table extended with: first_name, last_name, email, phone, zip_code, city_slug, system_type, issue_description, urgency, preferred_contact_time.
