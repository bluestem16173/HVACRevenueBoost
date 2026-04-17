# DG Authority — pillar page production briefs (LOCKED)

These are **production briefs**, not LLM prompts. Generators and editors must satisfy them for the three trade pillar pages. JSON layout remains `dg_authority_v3`; see `DG_Authority_V3_Master_Generation_Lock.md` for global rules.

**Renderer mapping (pillar-only optional fields)**

| Brief requirement | JSON / behavior |
|-------------------|-----------------|
| Simplified homeowner path | `simplified_path_home` (blue-only) and/or `simplified_path_pro` + `simplified_path_home` (dual layer). Rendered **inside** “System explanation”. |
| Start here (grouped links to symptoms) | `start_here_groups[]`: `{ "group_title", "items": [{ "title", "href" }] }`. Internal paths only. Rendered **inside** “System explanation”. |
| When to stop DIY (boundaries) | `when_to_stop_diy_pro` + `when_to_stop_diy_home` (both required if either set). Rendered **inside** “Professional threshold”. |
| Full cooling / tank / breaker story | `system_explanation` |
| Failure clusters (up to 4) | `failure_clusters` — pillar HVAC/plumbing/electrical use four thematic rows per brief below |
| Mermaid | `diagnostic_flow_template_key` = trade v1 + `diagnostic_flow_issue_label` |
| All 9 trade links | Cover every supporting slug via `start_here_groups` **and/or** bottom related graph; registry in `lib/dg/dgAuthorityGraph.ts` |

---

## PART 1 — 3 pillar page briefs (LOCKED)

### HVAC pillar

**Slug:** `/hvac/why-ac-isnt-cooling`  
**Title:** Why Your AC Isn’t Cooling: Complete Diagnostic Guide  

**Purpose**

- Central hub for all HVAC cooling-related issues  
- Explain airflow, refrigerant, compressor, and control systems  
- Route users to the correct symptom pages  

**Required sections**

- 30s summary (broad, not symptom-specific)  
- System explanation (full cooling cycle)  
- Simplified decision path (non-technical) → `simplified_path_*`  
- Full diagnostic flow → Mermaid **`hvac_v1`**  
- Failure clusters (**4 max**), themed as:  
  - airflow  
  - refrigerant  
  - compressor  
  - controls  

**Must include**

- **Start here** — at minimum surface these entry symptoms (via `start_here_groups` and/or grouped links):  
  - weak airflow  
  - AC not cooling  
  - outside unit not running  
  - frozen coil  
- **When to stop DIY** — clear boundary on:  
  - refrigerant handling  
  - electrical testing  
  - compressor issues  
  → `when_to_stop_diy_pro` / `when_to_stop_diy_home`  

**Internal links**

- Link to **all 9** HVAC authority URLs from `AUTHORITY_SUPPORTING_SLUGS.hvac`, **grouped by cluster** in `start_here_groups` (e.g. airflow vs outdoor vs capacity vs humidity vs escalation).  

---

### Plumbing pillar

**Slug:** `/plumbing/why-you-have-no-hot-water`  
**Title:** Why You Have No Hot Water: Complete Diagnostic Guide  

**Purpose**

- Central hub for water heater + supply issues  
- Separate heater vs distribution vs pressure problems  

**Required sections**

- 30s summary  
- System explanation (tank + gas/electric)  
- Simplified homeowner path → `simplified_path_*`  
- Mermaid → **`plumbing_v1`**  
- Failure clusters (**4 max**), themed as:  
  - electrical (elements / thermostat)  
  - gas system  
  - sediment / tank  
  - pressure / distribution  

**Must include**

- **Start here:**  
  - no hot water  
  - water heater leaking  
  - T&P valve dripping  
  - low pressure  
  (group links in `start_here_groups`.)  

**Internal links**

- Link to **all 9** plumbing authority URLs from `AUTHORITY_SUPPORTING_SLUGS.plumbing`, grouped by cluster in `start_here_groups`.  

---

### Electrical pillar

**Slug:** `/electrical/why-breakers-trip`  
**Title:** Why Breakers Trip: Complete Diagnostic Guide  

**Purpose**

- Central hub for overload, faults, and panel issues  
- Teach difference between overload vs fault  

**Required sections**

- 30s summary  
- System explanation (breaker physics)  
- Simplified path → `simplified_path_*`  
- Mermaid → **`electrical_v1`**  
- Failure clusters (**4 max**), themed as:  
  - overload  
  - wiring faults  
  - breaker failure  
  - panel issues  

**Must include**

- **Start here:**  
  - circuit overload → `/electrical/circuit-overload`  
  - breaker trips instantly → `/electrical/breaker-trips-instantly`  
  - outlet not working → `/electrical/outlet-not-working`  
  - burning smell (panel) → `/electrical/burning-smell-from-panel`  
  (group links in `start_here_groups`.)  

**Internal links**

- Link to **all 9** electrical authority URLs from `AUTHORITY_SUPPORTING_SLUGS.electrical`, grouped by cluster in `start_here_groups`.  

---

## PART 2 — 27 supporting pages (generation queue)

Canonical pipeline input: **`DG_Authority_Generation_Queue.json`** (same order: HVAC ×9, plumbing ×9, electrical ×9).  
TypeScript import: `DG_AUTHORITY_GENERATION_QUEUE` from `lib/dg/dgAuthorityGenerationQueue.ts`.

Each row supplies `trade`, `slug`, `title`, `cluster` (editorial grouping), `pillar` (hub path for `pillar_page`), and `mermaid` template key for `diagnostic_flow_template_key`.

---

## Quality bar

- Pillar summaries stay **broad**; symptom-specific copy belongs on child pages.  
- “Start here” lists must use **natural anchor titles** and only approved internal `href`s.  
- DIY stop content must not repeat verbatim lines from `warnings` or `do_not_attempt` (normalized dedupe where the renderer already applies rules).
