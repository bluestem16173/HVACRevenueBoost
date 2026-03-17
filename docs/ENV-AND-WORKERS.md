# Environment Variables & Workers

## Required: `.env.local`

Create `.env.local` in the project root with:

```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
OPENAI_API_KEY=sk-...
```

## Loading Order

All workers load env **at the very top** before any other imports:

```ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
```

`lib/db.ts` also loads `dotenv/config` and `.env.local` so `DATABASE_URL` is available when the DB client initializes.

## PowerShell: Setting Env Vars for Scripts

**Correct syntax** (set before running the command):

```powershell
$env:USE_CANARY = "true"
npx tsx scripts/canary-batch.ts
```

Or inline (same session):

```powershell
$env:DATABASE_URL = "postgresql://..."; npx tsx scripts/generation-worker.ts
```

**Wrong** (does not work in PowerShell):

```powershell
USE_CANARY=true npx tsx scripts/canary-batch.ts   # Bash syntax
```

## Stage 1 CORE Only (Default)

Canary and workers run **Stage 1 CORE only** by default. Enrichment is disabled.

- `max_tokens`: 800–850
- causes ≤ 3, repairs ≤ 3, steps ≤ 3

To re-enable enrichment (Stage 2):

```powershell
$env:USE_CORE_ONLY = "false"
npx tsx scripts/canary-batch.ts
```

## Two-Stage Generator (Full Pipeline)

Use full two-stage (Core + Enrichment) when `USE_CORE_ONLY=false`:

```powershell
$env:USE_CORE_ONLY = "false"
$env:USE_TWO_STAGE = "true"
npx tsx scripts/generation-worker.ts
```

See `docs/TWO-STAGE-ARCHITECTURE.md`.

---

## Optional: Local Dev Fallback

If you don't have Neon and want to run against local Postgres:

```powershell
$env:DB_FALLBACK = "postgresql://localhost:5432/dev"
npx tsx scripts/generation-worker.ts
```

Or add to `.env.local`:

```
DB_FALLBACK=postgresql://localhost:5432/dev
```

## Build Without DB (CI)

For builds where `DATABASE_URL` is not available:

```powershell
$env:BUILD_SKIP_DB = "true"
npm run build
```

## Success Criteria

- Workers run without crashing
- `DB connected: true` logs when DATABASE_URL is set
- Canary batch executes
- No `NeonDbError`
- Pages generate successfully
