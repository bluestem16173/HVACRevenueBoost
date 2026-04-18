# DG Authority v2 — generation lock (structured JSON)

Use this lock **whenever** you generate or revise `layout: "dg_authority_v2"` **structured** diagnostic pages (the contract with `quick_checks[]`, `diagnostic_logic`, etc.).

## Output rules

- **DO NOT** include layout, styling, or UI instructions in any string field.
- Output **strictly structured JSON** matching the dg_authority_v2 schema your pipeline validates against.
- **Failure clusters** must be plain technical paragraphs in `details` (no UI language, no “cards”, no formatting instructions, no Tailwind/CSS).
- **Diagnostic flow** must be **valid Mermaid** syntax: either a full diagram string in `diagnostic_flow`, or a structured `{ "nodes": [...], "edges": [...] }` graph that your builder turns into Mermaid — never ambiguous prose where a diagram is required.
- **Repair matrix** must be concise **cost ↔ action** mappings (short strings, one row per mapping).
- **Field measurements** must be **measurable quantities only** (values, bands, units) — no long explanatory prose in that array.

## Required top-level fields

`layout`, **`schema_version`** (both must be `"dg_authority_v2"`), `title`, `summary_30s`, `quick_checks`, `diagnostic_logic`, `diagnostic_flow`, `system_explanation`, `failure_clusters`, `repair_matrix`, `field_measurements`, `repair_vs_replace`, `professional_threshold`, `warnings` (array of strings), `next_step`.

If any required field is missing or wrong type → **validation must fail**; do not publish.
