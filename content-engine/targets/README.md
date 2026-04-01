# PageTargets (fuel / inputs)

What **should** be built: target slugs, priorities, scoring, filters — before or beside `generation_queue`.

- `generate-targets.ts` — emit `PageTarget[]` (see `lib/content-system/page-target-types.ts`)
- `scoring.ts`, `filters.ts` — rank and gate targets

Queue rows are the operational queue; **PageTargets** are the strategic list feeding it.
