# 100KPageMaker

**The machine** — end-to-end programmatic page output (schemas, prompts, validators, templates per type).

Naming stack: **100KPageMaker** (machine) · **PageFrame** (`content-engine/pageframe/`) · **DriveShaft** (`content-engine/driveshaft/`) · **Orchestrator** (`content-engine/orchestrator/`) · **PageTargets** (`content-engine/targets/`). See `content-engine/README.md`.

- **Registry (authoritative metadata):** `config/page-types.ts`
- **Machine inventory snapshot:** `config/page-types-inventory.json`
- **Runtime facade:** `lib/content-system/registry.ts`

## Layout

```
100KPageMaker/
  page-types/
    symptom/    schema.ts, prompt.ts, validator.ts, template.ts
    repair/     schema.ts, prompt.ts, validator.ts, template.ts
  versions/
    v1/                 legacy / baseline schemas (evolve without breaking old pages)
    v2_goldstandard/    matches schema_version v2_goldstandard + GoldStandardPage
```

Add more folders under `page-types/` as you add canonical types to the registry.  
Add **`versions/vNext/`** when you introduce a new `pages.schema_version` and keep old dirs read-only for migrations.
