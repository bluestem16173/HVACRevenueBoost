# HVAC SEO CLUSTER & FLYWHEEL ORCHESTRATION ENGINE

This is the ultimate SEO intelligence layer, mapping the dual-engine strategy: **Cluster Architecture** (the content skeleton) and **Flywheel Expansion** (the compounding growth motion).

---

## PART 1: THE CLUSTER ARCHITECTURE
This taxonomy defines exactly *what* pages exist and how they are rigidly categorized to prevent cannibalization and keyword mush.

### 1. Pillar Cluster
**Purpose:** Top-level authority hubs that catch broad traffic and distribute PageRank downward.
*   Furnace Diagnostics
*   No Heat Diagnostics
*   Airflow / Limit / Safety Shutdown Problems

### 2. Symptom Cluster
**Purpose:** What the user actually experiences and searches. Maximum panic/urgency.
*   `furnace-not-turning-on`
*   `furnace-blowing-cold-air`
*   `furnace-shuts-off-after-few-minutes`

### 3. Cause Cluster
**Purpose:** Why the symptom is happening. Deep technical failure sources.
*   `pressure-switch-stuck-open`
*   `bad-flame-sensor`
*   `control-board-fuse-blown`

### 4. System Explainer Cluster
**Purpose:** How the subsystem natively functions. Establishes pure HCU-proof topical authority.
*   `how-furnace-ignition-sequence-works`
*   `what-a-flame-sensor-does`
*   `why-furnaces-go-into-lockout`

### 5. Repair / Decision Cluster
**Purpose:** Deep-funnel conversion. Cost analysis and professional escalation thresholds.
*   `ignitor-replacement-cost`
*   `flame-sensor-cleaning-vs-replacement`
*   `repair-vs-replace-old-gas-furnace`

---

## PART 2: THE FLYWHEEL EXPANSION RULES
This is the compounding motion. Every generated page must inherently spin the wheel, justifying the existence of the next wave of pages.

**For every published page, the generation pipeline MUST automatically output:**
1.  **3-5 Related Symptom Pages:** (e.g., if on "clicks but won't ignite", queue "blows cold air").
2.  **2-3 System Pages:** (e.g., queue "how the ignition sequence works").
3.  **1 Pillar Hub:** (e.g., map upward to "Furnace Ignition Problems").
4.  **1-2 Repair/Decision Pages:** (e.g., queue "ignitor replacement cost").
5.  **5-10 Next-Generation Candidates:** (Explicitly identify missing nodes caused by this new page's relationships and push them to the DB staging queue).

---

## PART 3: INTENT-GENERATION PROMPTS

### A. The Meta Generation Prompt
**SYSTEM INSTRUCTION:**
You are the HVAC Expansion Engine. Generate metadata for `{SLUG}`.
1. Determine its Taxonomy Class: `[Pillar | Symptom | Cause | System | Repair | Decision]`
2. **Title:** Must use targeted class framing. (e.g., a *Symptom* page uses `[Symptom]? 4 Causes & Next Steps`. A *Cause* page uses `[Cause]: Symptoms, Fixes & Costs`).
3. **Meta Description:** Name the exact technical issue, reference 2 adjacent nodes, and drive click-through urgency.

### B. The Flywheel Internal Linking Prompt
**SYSTEM INSTRUCTION:**
For the current `{TAXONOMY_CLASS}` page, map the `internal_links` array using strict flywheel logic:
- If current is a **Symptom**, link down to its specific **Causes**.
- If current is a **Cause**, link laterally to related **Symptoms** and down to its parent **System Explainer**.
- If current is a **System Explainer**, link outward to multiple **Symptoms** and **Decisions**.
- If current is a **Repair/Decision**, link strongly upward to **Symptoms** and **Causes**.

### C. The Knowledge-Graph / Entity Extractor
**SYSTEM INSTRUCTION:**
Before generating JSON payload for `{SLUG}`, map the HVAC Entity Graph:
1. Primary Equipment (e.g., Gas Furnace)
2. Affected Subsystem (e.g., Ignition Sequence)
3. Suspect Components (e.g., Hot Surface Ignitor, Flame Sensor)
4. Primary Risk Factor (e.g., Unsafe combustion)
*Barrier Rule:* The AI cannot reference or link to components outside of the 'Affected Subsystem' unless tracking a specific cascading failure. This prevents generalized "check the filter" fluff across deeply technical repair pages.
