# DriveShaft (execution)

**Movement**: generation pipeline, queue claim/release, worker entrypoints. This is what runs when jobs move from draft → published.

- **`pipeline/`** — `generateDiagnosticEngineJson`, validation runner, relational publisher
- **`queue/`** — `getQueuedJobs`, `peekQueuedJobs`, enqueue/retry helpers
- **`workers/`** — documents `scripts/generation-worker.ts` (real process entry)

Cross-ref: **`lib/orchestrator/runner.ts`** spawns the worker.
