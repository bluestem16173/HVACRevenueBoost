# DG Authority v3 — master generation lock

**DESIGN FREEZE (first cluster):** Layout, section order, legend, blue/gold/red layers, Mermaid template keys (`hvac_v1` / `plumbing_v1` / `electrical_v1`), interlinking in `dgAuthorityGraph.ts`, and CTA placement are locked. Do not change them during this build unless the project explicitly unfreezes — see `.cursor/rules/dg-authority-cluster-freeze.mdc`. **Pillar page production briefs:** `DG_Authority_Pillar_Page_Briefs.md`.

Non-negotiables for the first DecisionGrid authority cluster: section order, legend semantics, one Mermaid per page (renderer-built from template key + issue label only), interlinking, and CTA placement are frozen in code (`RenderDgAuthorityV3`, `dgAuthorityGraph`, `dgMermaidTemplates`, validators).

## Locked section order

1. Trade pill + DG legend  
2. Hero box  
3. Top CTA  
4. Quick Checks  
5. Before you call  
6. Safety notice (optional JSON `safety_notice`, then live-electricity notice where applicable)  
7. Diagnostic Logic  
8. Diagnostic Flow (Mermaid — template only)  
9. System Explanation  
10. Failure Clusters (max 4; pillars use four thematic clusters)  
11. Mid safety / risk (`mid_safety_notice`, optional)  
12. Repair Matrix + mid CTA  
13. Field Measurements  
14. Repair vs Replace  
15. Professional Threshold  
16. Warnings  
17. Where people get this wrong (`where_people_get_this_wrong` or `risk_notes`)  
18. Final CTA  
19. Related diagnostics (symptoms + pillar + cost/replace groups)  
20. Do not attempt  

## Hard rules

- No repeated bullet lists, CTA copy, or warning copy across sections.  
- Gold = technical signal; blue = homeowner meaning; red = risk / misdiagnosis.  
- Exactly one Mermaid block per page; no raw Mermaid in model output — use `diagnostic_flow_template_key` + `diagnostic_flow_issue_label`.  
- Internal links only in approved zones (`related_pages`, `related_links`, registry graph).  
- Every supporting page: pillar + 3 siblings + cost + repair-vs-replace (graph + JSON).  
- Pillar pages: all 9 supporting slugs for that trade; plus cost + repair-vs-replace hubs.

## Template keys (Mermaid)

One of: `hvac_v1`, `plumbing_v1`, `electrical_v1`.  
Skeletons are fixed in `lib/dg/dgMermaidTemplates.ts`.  
Optional `diagnostic_flow_mermaid_caption_home` = blue line under the diagram.

## Pillar slugs

| Trade       | Slug                          | Title |
|------------|--------------------------------|-------|
| HVAC       | `/hvac/why-ac-isnt-cooling`    | Why Your AC Isn’t Cooling: Complete Diagnostic Guide |
| Plumbing   | `/plumbing/why-you-have-no-hot-water` | Why You Have No Hot Water: Complete Diagnostic Guide |
| Electrical | `/electrical/why-breakers-trip` | Why Breakers Trip: Complete Diagnostic Guide |

## Supporting slugs (9 each)

- **HVAC:** `ac-not-cooling`, `weak-airflow`, `ac-short-cycling`, `outside-unit-not-running`, `frozen-evaporator-coil`, `ac-blowing-warm-air`, `ac-making-noise`, `high-humidity-in-house`, `hvac-repair-vs-replace`  
- **Plumbing:** `water-heater-not-working`, `no-hot-water`, `water-heater-leaking`, `low-water-pressure`, `no-water-in-house`, `toilet-wont-flush`, `drain-smell-in-house`, `t-p-relief-valve-dripping`, `water-heater-repair-vs-replace`  
- **Electrical:** `circuit-overload`, `breaker-trips-instantly`, `outlet-not-working`, `lights-flickering`, `burning-smell-from-panel`, `gfci-keeps-tripping`, `partial-power-in-house`, `panel-buzzing`, `electrical-repair-vs-replace`  

Sibling triples are locked in `AUTHORITY_SIBLING_BY_SLUG` in `lib/dg/dgAuthorityGraph.ts`.

## Publish order

1. Generate and publish **3 pillar pages** (briefs: `DG_Authority_Pillar_Page_Briefs.md`).  
2. QA: 3 supporting pages per trade from **`DG_Authority_Generation_Queue.json`**.  
3. Validate internal links + Mermaid build.  
4. Remaining **6 per trade** from the same queue (27 supporting total — `DG_AUTHORITY_GENERATION_QUEUE` in `lib/dg/dgAuthorityGenerationQueue.ts`).  
5. Do not change layout, legend, Mermaid system, interlinking rules, or CTA placement during this cluster build.

---

## Master prompt (per page)

You are a 30-year veteran residential diagnostic technician writing a DecisionGrid authority page.

Output strict JSON for layout `dg_authority_v3`.

The page must preserve the locked DG structure and must not introduce new sections.

Write in 3 layers:

1. Pro / Technical Signal  
2. Homeowner / What this means  
3. Risk / Where people get this wrong  

Rules:

- No repeated bullets  
- No repeated warning text  
- No generic CTA language  
- No fluff, blog voice, or salesy language  
- Every section must add new information  
- Use field logic, measured signals, and real-world consequences  
- Reinforce when the issue crosses out of safe DIY territory  

Include:

- `title`, `summary_30s`, `cta_top`, `quick_checks` (4–5 max), `quick_checks_home`, `before_you_call`, `safety_notice` (optional), `diagnostic_logic_pro`, `diagnostic_logic_home`  
- `diagnostic_flow_template_key` (`hvac_v1` | `plumbing_v1` | `electrical_v1`), `diagnostic_flow_issue_label` (usually = title), optional `diagnostic_flow_highlight`, optional `diagnostic_flow_mermaid_caption_home`  
- `diagnostic_flow` may be a minimal placeholder object when using template keys — renderer ignores raw Mermaid  
- `system_explanation`, `failure_clusters` (1–4 rows; each `title`, `pro`, `home`, `risk`)
- Pillar-only (optional): `simplified_path_pro` / `simplified_path_home`, `start_here_groups`, `when_to_stop_diy_pro` / `when_to_stop_diy_home` — see `DG_Authority_Pillar_Page_Briefs.md`  
- `repair_matrix`, `repair_matrix_pro`, `repair_matrix_home`, `repair_matrix_risk`  
- `cta_mid`, `field_measurements`, `field_measurements_home`, `field_measurements_pro`  
- `repair_vs_replace_pro`, `repair_vs_replace_home`, `professional_threshold`, `warnings`  
- `where_people_get_this_wrong` (optional string) **or** `risk_notes` (array of `{ label, text }`)  
- `cta_final`, `do_not_attempt`, `related_pages` (3–5 internal), `pillar_page` (pillar hub), `trade`, `slug`  
- Optional `mid_safety_notice` between clusters and repair matrix  

Internal linking:

- 3 `related_pages` from the same trade cluster (siblings)  
- `pillar_page` for the trade pillar  
- One repair-vs-replace page when this page is not itself repair-vs-replace  
- Cost implication via registry + `related_links` where appropriate  

Mermaid:

- Select exactly one `diagnostic_flow_template_key`  
- Provide `diagnostic_flow_issue_label`; do not output raw Mermaid  

### Pillar / hub add-on

Follow **`DG_Authority_Pillar_Page_Briefs.md`** (locked slugs, purposes, cluster themes, and “Start here” entry symptoms per trade).

This is a pillar / hub page. It must:

- Explain the system at a higher level (`system_explanation`)  
- Use **`start_here_groups`** so all **9** supporting URLs appear, grouped by subcluster  
- Use **`simplified_path_home`** (and optional **`simplified_path_pro`**) for the non-technical path  
- Use **`when_to_stop_diy_pro`** + **`when_to_stop_diy_home`** for the DIY boundary (refrigerant / live electrical / compressor, etc., per brief)  
- Use up to **4** `failure_clusters` rows matching the brief’s four themes  
- Preserve DG Authority voice  
