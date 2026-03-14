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
