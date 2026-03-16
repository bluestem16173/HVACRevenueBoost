# Seed 010 Verification

## Overview

`010_seed_initial_knowledge_graph.sql` + `scripts/run-seed-010.ts` seed the knowledge graph for programmatic SEO generation.

## Run Order

1. **Migration 010** (schema completion): `npm run db:migrate-010`
2. **Seed 010** (runs migration 011 first, then seed): `npm run db:seed-010`

## Expected Row Counts (Minimum)

| Table            | Target | Notes                          |
|------------------|--------|--------------------------------|
| systems          | 10     | RV HVAC, Residential HVAC, etc.|
| symptoms         | ≥40    | HVAC + RV HVAC symptoms        |
| causes           | ≥60    | Root causes                    |
| repairs          | ≥80    | Repair actions                 |
| components       | ≥20    | HVAC components                |
| tools            | ≥10    | DIY tools                      |
| environments     | ≥10    | Contextual modifiers           |
| vehicle_models   | ≥10    | RV models (if table exists)    |
| cities           | ≥200   | Major US cities                |
| generation_queue | ~500   | Page targets for workers       |
| symptom_causes   | -      | Symptom → cause links          |
| cause_repairs    | -      | Cause → repair links           |
| related_nodes    | -      | Internal link graph            |

## Schema Variations

Your DB may use UUID vs SERIAL, or different column names. Migration `011_seed_schema_compatibility.sql` adds missing columns (description, skill_level, state_code, etc.) before seeding.

- **repairs**: If `cause_id` is NOT NULL, repairs may not seed. The seed expects 008-style standalone repairs.
- **vehicle_models**: Created by migration 011 if missing.
- **cities**: Adapts to `state_code` / `country` presence.

## Verification Commands

```bash
npm run db:seed-010
```

The script prints row counts at the end. Confirm:

- ✓ symptoms ≥ 40
- ✓ causes ≥ 60
- ✓ repairs ≥ 80 (or 0 if schema requires cause_id)
- ✓ components ≥ 20
- ✓ tools ≥ 10
- ✓ environments ≥ 10
- ✓ cities ≥ 200
- ✓ generation_queue populated

## Idempotency

- SQL uses `WHERE NOT EXISTS` / `ON CONFLICT DO NOTHING` where applicable.
- Safe to run multiple times.
