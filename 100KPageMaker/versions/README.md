# Schema versions

Pin **prompt + schema + validator** snapshots per `pages.schema_version` (or legacy era) so new work can ship under **vNext** without rewriting old rows.

- **`v1/`** — baseline / legacy shapes still in the wild.
- **`v2_goldstandard/`** — matches `schema_version === "v2_goldstandard"` and `GoldStandardPage`.

Add folders like `v5_master/`, `decisiongrid_master/` when you split implementations.

**Convention:** copy or symlink forward-only; readers resolve by `schema_version` in the worker or `inferDiagnosticSchemaVersion`.
