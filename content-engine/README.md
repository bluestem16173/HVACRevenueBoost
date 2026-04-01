# `content-engine/` — actual code (do not rename this folder)

Naming model:

| Concept | Role | Folder |
|--------|------|--------|
| **100KPageMaker** | The machine — full system output (brand + `100KPageMaker/` assets) | repo: `100KPageMaker/` |
| **PageFrame** | Structure — chassis (schemas, registry, templates, expansion patterns) | `pageframe/` |
| **DriveShaft** | Execution — motion (pipeline, queue, workers) | `driveshaft/` |
| **Orchestrator** | Controller — brain (run planning, dispatch, monitor) | `orchestrator/` |
| **PageTargets** | Inputs — fuel (what to build, scoring, filters) | `targets/` |

Mental model: **PageFrame** → chassis · **DriveShaft** → motion · **Orchestrator** → control · **100KPageMaker** → end-to-end product.

## Layout

```
content-engine/
  pageframe/       ← PageFrame layer
    registry/      page-types, templates, validators
    expansion/     patterns, snowball
  driveshaft/      ← DriveShaft layer
    pipeline/      generator, validator-runner, publisher
    queue/         enqueue, dequeue, retry
    workers/       generation-worker entry refs
  orchestrator/    ← controller
  targets/         ← PageTargets (inputs)
```

Implementation detail modules remain in `lib/content-engine/`; this tree is the **map** and thin re-exports.
