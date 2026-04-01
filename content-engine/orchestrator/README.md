# Orchestrator (controller)

**Brain**: when to run, cost bounds, dispatch to **DriveShaft**, observability.

- `run.ts` — `processQueue` from `lib/orchestrator/runner`
- `dispatcher.ts`, `planner.ts`, `monitor.ts` — hooks for richer planning

UI: `app/orchestrator/page.tsx` + `app/api/orchestrator/*`.
