# Database Migrations

## Migration 001: Diagnostic Tests + Conditions

Adds the diagnostic tests layer and prepares the conditions layer for the knowledge graph.

### Run Migration (Neon)

**Option A: Neon Console**
1. Open Neon Dashboard → SQL Editor
2. Paste contents of `001-diagnostic-tests-and-conditions.sql`
3. Execute

**Option B: psql**
```bash
psql $DATABASE_URL -f scripts/migrations/001-diagnostic-tests-and-conditions.sql
```

### Seed Diagnostic Tests

After migration, seed diagnostic tests and link them to causes:

```bash
npm run db:seed-diagnostic-tests
```

Requires:
- `diagnostic_tests` table
- `cause_diagnostic_tests` table
- `causes` table with seeded causes (run seed-neon or seed-5-tier first)

---

## Migration 002: HVAC Diagnostic Graph Schema

Full relational schema for Pillar → Cluster → Symptom → Condition → Cause → Repair → Component.

Uses `hvac` schema to avoid conflicts with existing decisiongrid tables. Designed for 100k–300k page scale.

### Run Migration

```bash
psql $DATABASE_URL -f scripts/migrations/002-hvac-diagnostic-graph-schema.sql
```

### Seed HVAC Graph

Populates `hvac.*` tables from static knowledge (lib/clusters, lib/conditions, data/knowledge-graph):

```bash
npm run db:seed-hvac-graph
```

### Tables Created

| Table | Purpose |
|-------|---------|
| hvac.pillars | Top-level domains (hvac-air-conditioning, hvac-heating-systems, etc.) |
| hvac.clusters | Problem categories (ac-not-cooling, weak-airflow, etc.) |
| hvac.symptoms | Observable problems → /diagnose/[slug] |
| hvac.condition_patterns | Templates: {symptom} but unit running, etc. |
| hvac.conditions | Pattern-applied symptoms → /conditions/[slug] |
| hvac.causes | Root causes |
| hvac.condition_causes | Condition ↔ Cause junction |
| hvac.repairs | Repair procedures → /fix/[slug] |
| hvac.components | Parts → /components/[slug] |
| hvac.repair_components | Repair ↔ Component junction |
| hvac.diagnostic_tests | Technician verification procedures |
| hvac.cause_diagnostic_tests | Cause ↔ Test junction |
| hvac.cities | For /repair/{city}/{symptom} |

---

## Migration 003: Related Nodes (Phase 16)

Dense internal linking. 4-8 related nodes per page.

### Run Migration

```bash
psql $DATABASE_URL -f scripts/migrations/003-related-nodes.sql
```

### Build Related Graph

```bash
npm run db:build-related-graph
```

Generates relations: related-problem, similar-cause, alternative-repair, same-component-family, same-condition-family, same-system-cluster.
