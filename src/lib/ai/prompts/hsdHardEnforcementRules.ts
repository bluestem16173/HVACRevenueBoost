/**
 * Prepended in {@link buildPrompt} (`generateHsdPage.ts`) after {@link HSD_MASTER_FIELD_AUTHORITY_LAYER}.
 * Non-negotiable contract for HSD diagnostic JSON — model must self-validate before emitting.
 */
export const HSD_HARD_ENFORCEMENT_RULES = `
---

## HARD ENFORCEMENT RULES (FAIL OUTPUT IF VIOLATED)

This page is a diagnostic engine, not a blog post.

### GLOBAL RULES

- **Localized slugs (three path segments):** Differentiate pages with **\`cityContext\` bullets** (2–4 lines: climate, salt/corrosion, demand, canals/storms as relevant to **{{CITY}}**) and natural **{{CITY}}** in **title** / **cta** / **headline** where it reads as location—not new mechanics. **Do not** rewrite entire \`diagnostic_steps\`, \`what_this_means\`, \`quick_table\`, \`repair_matrix\`, or \`common_misdiagnosis\` per city, and do not introduce city-only failure theories—**only the context layer** may vary.
- **Cross-section rule:** If any section contains **both** a diagnosis **and** a recommended action in the **same sentence or line**, the output is **invalid** (split classification from action across the correct sections).
- Write like a 30-year field technician.
- Use dense, decisive language.
- Every section must reduce uncertainty or force a decision.
- No fluff, no generic filler, no soft hedging.
- Do not explain the same idea twice in different sections.
- Do not use long intro paragraphs where a decision list would work better.

### FINAL REQUIRED PAGE ORDER

1. Title
2. Field Triage
3. Possible Reasons
4. Most Common Cause
5. What This Means
6. Quick Checks
7. Diagnostic Flow
8. Top Causes
9. Common Misdiagnosis
10. Repair Matrix
11. System Age & Load
12. Code Updates
13. Repair vs Replace
14. Risk Escalation (**electrical only** — heat → arcing → fire framing; omit on HVAC/plumbing unless you have trade-correct escalation copy)
15. Upgrade Paths
16. CTA

### ELECTRICAL \`risk_escalation\` (optional JSON object — **high value**)

When the job is **electrical** (slug starts with \`electrical/\`), include \`risk_escalation\` with:
- \`intro\`: one line that states faults **do not stay contained** (or equivalent decisive framing).
- \`if_ignored\`: **≥ 2** short escalation chains using **→** (minimum three beats total across lines), covering **overheating / insulation**, **loose connections / arcing**, and **arcing / fire risk** without soft hedging.
- \`closing\`: ties the **starting symptom** (e.g. breaker tripping) to **fire / structural hazard** when ignored.
- Optional \`title\`: default intent is **Risk escalation** (renderer fallback).

### FIELD TRIAGE RULES (MANDATORY)

**Purpose:** Help the user recognize their exact situation **instantly**.

**Requirements:**
- MUST be based on **observable behavior** (what the user sees, hears, or feels).
- MUST NOT use abstract or system-framework language (e.g. "control class", "mechanical class", "failure domain", "subsystem imbalance").
- MUST NOT include fixes, actions, or recommendations (no "check", "replace", "call", "reset", "flush", "install", "hire", "schedule").
- MUST NOT use internal-only diagnostic jargon meant for techs, not homeowners.
- **\`summary_30s.flow_lines\`:** **3–5 lines max.** Each line MUST follow: **\[user scenario\] → \[likely failure type\]** (plain language; the right side names what class of fault the pattern points to, not what to do about it).

**Style:** Short, scannable, instantly recognizable.

**FAIL:** Triage reads like a technical framework, **or** a user cannot immediately match a line to their situation, **or** any triage line contains fix/action language → **INVALID**.

- **plumbing/no-hot-water:** \`summary_30s.core_truth\` stays **classification framing** (why the scan lines exist). **Forbidden in core_truth:** consequence/threat openers like "Ignoring …", "can lead to …", "if left untreated …" — those belong in \`risk_warning\`, \`final_warning\`, cost sections, \`what_this_means\`, or \`risk_escalation\` (electrical), not under the triage scan.

### URGENCY MODEL (MANDATORY — ALL TRADES)

Communicate risk **without exaggeration** and **without scare tactics**.

**Rules:**
- Use **cause → effect → consequence** chains (physical escalation), not emotional adjectives.
- **Forbidden:** vague dread ("this could be bad"), **forbidden:** catastrophic hype ("your house will burn down", "disaster", "nightmare").

**Every page MUST include:**
1. **Why this matters (mechanical reality):** primarily in \`what_this_means\` — observable mechanism, how the fault behaves under load, what gets worse if the condition persists (still classification + physics, not triage fixes).
2. **Hard truth (decision pressure):** at least one unmistakable line — typically the closing beat of \`repair_vs_replace\` **or** a single sharp line in \`summary_30s.risk_warning\` / \`final_warning\` that states the cost/stop implication without drama.

**Structure to hit across the page (weave into allowed fields, do not duplicate verbatim 4×):**
- Reality block: cause → effect
- Escalation: what physically happens if ignored
- Decision pressure: clear implication (delay/stabilize/cost)

### ELECTRICAL URGENCY (CRITICAL)

Treat electrical faults as **safety-class**, not annoyance-class.

**Requirements:**
- MUST address heat buildup, abnormal current, and/or arc risk where relevant to the symptom.
- MUST treat breakers as **protective devices** (they interrupt fault current) — **do not** normalize repeated trips as "nuisance" or "just reset it."
- Align escalation copy with \`risk_escalation\` when present: faults **do not stay contained**; uncorrected trip sources → heat in conductors → insulation stress → arc risk. **Hard truth** tone (example class): *A breaker that keeps tripping is not the problem — it is the warning.*

### WHAT THIS MEANS RULES

- If shorter schema notes elsewhere in this prompt conflict with this block, **obey HARD ENFORCEMENT** for this field.
- This section MUST explain mechanical reality, not general consequences.
- It MUST contain at least 3 cause → effect chains using arrows.
- It MUST explain how the failure physically behaves.
- It MUST NOT say generic phrases like:
  - "the system is not functioning"
  - "this can lead to serious issues"
  - "major failures if not addressed"
- If the section reads like a blog summary instead of a system explanation, the output is invalid.

GOOD EXAMPLE:

This is a failed heat transfer system.

If the element is open → no current → no heat
If the thermostat does not close → element never energizes
If sediment insulates the element → heat is trapped → element overheats and fails

Result:
- No heat output
- Unstable temperature
- Accelerating internal damage

### QUICK CHECKS RULES

- Start immediately with the steps.
- Maximum one short intro sentence.
- Each check must contain:
  1. what to check
  2. what it means
  3. what to do next
- Include explicit stop/call-pro conditions.
- **plumbing/no-hot-water (electric tank):** \`check\` must name an **observation or measurement gate** (breaker state, setpoint vs outlet sample, post-draw heat cycle, hot-only discoloration). **Invalid:** vague advice like "Ensure thermostat is set high enough" without a **comparable observation** (\`homeowner\` must describe what to verify and how it branches).
- \`result_meaning\` must use an **IF / then → failure class** pattern where possible; \`next_step\` must be the **next test or stop**, not generic encouragement.

### DIAGNOSTIC FLOW RULES

- Diagnostic Flow MUST be strict step-by-step binary logic.
- It MUST read like a checklist.
- It MUST use IF/THEN logic.
- It MUST NOT include background teaching paragraphs.
- It MUST NOT include commentary like "a technician will..." unless schema requires it elsewhere.
- If it reads like explanation instead of branch logic, the output is invalid.

GOOD EXAMPLE:

Step 1 — Check power
IF no power → electrical issue → stop

Step 2 — Check thermostat output
IF no signal → replace thermostat

Step 3 — Test element resistance
IF open circuit → replace element

Step 4 — Inspect for sediment
IF severe buildup → flush or replace (based on age)

### TOP CAUSES RULES

- Include 3 to 5 ranked causes.
- Each cause must include likelihood: High / Medium / Low.

### COMMON MISDIAGNOSIS RULES

- This section is REQUIRED.
- Minimum 4 bullet points.
- Each item must describe a real wrong assumption or wrong fix.
- At least one line must connect misdiagnosis to wasted money.
- If section is missing, output is invalid.

GOOD EXAMPLE:

Common Misdiagnosis
- Replacing the element when the breaker is tripped
- Flushing the tank when the thermostat has failed
- Assuming no hot water means the whole tank is bad
- Ignoring sediment and burning out the new element
Why it matters:
Misdiagnosis is how a $200 fix becomes a $1,500 replacement.

### REPAIR MATRIX RULES

- This section is tactical only.
- Use clean issue / fix / cost / difficulty logic.
- No emotional language here.
- No urgency language here.

### REPAIR VS REPLACE RULES

- This section is the escalation / pressure section.
- It MUST include:
  1. bad temporary fixes or jury-rigging behavior
  2. consequence stacking
  3. repair-first rules
  4. replace-first rules
  5. one hard-truth closing line
- It MUST make delay feel expensive.
- If it reads like neutral educational copy, the output is invalid.

GOOD EXAMPLE:

Repair vs Replace (Where people lose money)

Temporary fixes feel cheaper—but they accelerate failure.

What actually happens:
- Replace element without flushing sediment → new element burns out
- Reset breaker without diagnosing cause → electrical damage compounds
- Ignore early corrosion → tank failure → full replacement

Repair-first when:
- Tank is under about 8–10 years
- Shell is dry
- Failure is isolated to one measurable component

Replace-first when:
- Rust or leaks are visible
- Parts have already been replaced and the issue returned
- The tank is older and multiple symptoms are stacking

Hard truth:
If you are stacking repairs, you are already in replacement territory.

### CTA RULES

- CTA must be tied to a threshold:
  - unsafe to continue
  - misdiagnosis risk
  - cost escalation
- CTA must not be generic.
- CTA must feel earned by the page logic.

### INTERNAL LINKING — RELATED SECTION (MANDATORY — HARD FAIL)

The live **Related** band is powered by \`internal_links.related_symptoms\`. **Missing \`internal_links\`, empty arrays where counts are required, or breaking the rules below → output is INVALID.**

#### LOCALIZED ELECTRICAL + LEE GRID (\`electrical/{symptom}/{city-fl}\`) — **ANCHOR HUB (HARD)**

- **Every** such page MUST list \`electrical/breaker-keeps-tripping/fort-myers-fl\` in \`related_symptoms\` **unless** the page slug **is** exactly that path (do not link to yourself).
- Use **slug path only** (no leading \`/\`, no \`https://\`). The server may merge a deterministic set at finalize — still emit this anchor in model output so validation matches intent.
- Include **at least 4** total \`related_symptoms\` entries (max **5**): anchor + same-city peers + national pillar \`electrical/{condition_slug}\` + one cross-city same-symptom path. **Never** cross-trade links.
- **HTML injection (Lee \`*-fl\` plumbing/electrical locals):** The renderer appends crawl-safe **Problem cluster** (national pillar + same symptom across multiple Lee cities, Fort Myers first when applicable) and **Related problems** (same-city, different symptoms) **above the site footer**. Do not mirror those blocks as long prose or second footers in the JSON body.
- **Three-segment trade locals (\`{trade}/{condition}/{city}\`):** The **Related Pages** strip (national condition primer + two same-trade/city peers) is rendered by the **Next.js layout shell**, not \`content_json\` — do **not** duplicate that three-link block in the model output.

---

- \`related_symptoms\` MUST have **3, 4, or 5** string entries (inclusive). Each entry is a **slug path only** (e.g. \`plumbing/water-heater-leaking/fort-myers-fl\`). **No** \`https://\`, **no** domains, **no** bare \`/\` homepage.
- **At least 2** entries: **same trade** as the job, **different symptom** from this page, **same failure cluster or system story** (technician-plausible laterals — not random slugs).
  - When the job storage slug has **three** segments (\`{vertical}/{symptom}/{city-fl}\`), those **≥2** laterals MUST end with the **same \`{city-fl}\`** tail as the job.
  - When the job is **national** (two segments), those **≥2** laterals are **other two-segment** same-trade symptom paths.
- **At least 1** entry: **either** same symptom (or tight cluster) with a **different city tail** (\`*-fl\` segment than the job), **or** a **two-segment** same-trade system/primer pillar that supports this symptom class.
- **Optional:** one extra same-trade link for depth. **Do not** duplicate the same path twice in \`related_symptoms\`.
- **Never** link to **another vertical**, marketing homepage only, or off-site URLs inside these arrays.
- Still populate \`system_pages\` and \`repair_guides\` per the server contract (counts in the master prompt) — they complement Related; they do not replace it.

### STYLE LOCK (GLOBAL)

- Sound like a **field technician**, not a marketer.
- Be **direct**, not dramatic; **precise**, not verbose; every sentence must add clarity or legitimate decision pressure.
- Prefer short paragraphs and lists over long paragraphs.
- Use arrows (→) to show causality where the schema allows.
- Urgent **only** where risk is real and explained physically — not on every line.
- Do not pad the page with repeated warnings.

### FINAL QUALITY BAR

The page must feel like:
- a field diagnostic checklist
- a decision framework
- a repair/replacement fork
- a conversion page

If it feels like an article, the output failed.

---

## GOLD REFERENCE BLOCKS

Use these as anchor examples inside the prompt so the model has something concrete to imitate.

### FIELD TRIAGE EXAMPLE (PLUMBING — LOCK PATTERN)

No hot water at all?
→ Heating failure or power issue

Water starts hot then turns cold quickly?
→ Sediment or recovery problem

Rusty or discolored hot water?
→ Tank corrosion

Water pooling around the heater?
→ Leak or tank failure

### FIELD TRIAGE EXAMPLE (ELECTRICAL — LOCK PATTERN)

Breaker trips immediately when you reset it?
→ Short circuit or ground fault

Breaker trips when you turn something on?
→ Circuit overload or failing device

Breaker trips randomly with no pattern?
→ Loose connection or intermittent fault

Breaker trips during rain or humidity?
→ Outdoor or moisture-related fault

### WHAT THIS MEANS EXAMPLE

This is a failed heat transfer system.

If the element is open → no current → no heat
If the thermostat does not close → element never energizes
If sediment insulates the element → heat is trapped → element overheats and fails

Result:
- No heat output
- Unstable temperature
- Accelerating internal damage

### COMMON MISDIAGNOSIS EXAMPLE

Common Misdiagnosis
- Replacing the element when the breaker is tripped
- Flushing the tank when the thermostat has failed
- Assuming no hot water means the whole tank is bad
- Ignoring sediment and burning out the new element

Why it matters:
Misdiagnosis is how a $200 fix becomes a $1,500 replacement.

### REPAIR VS REPLACE EXAMPLE

Repair vs Replace (Where people lose money)

Temporary fixes feel cheaper—but they accelerate failure.

What actually happens:
- Replace element without flushing sediment → new element burns out
- Reset breaker without diagnosing cause → electrical damage compounds
- Ignore early corrosion → tank failure → full replacement

Repair-first when:
- Tank under about 8–10 years
- Dry shell
- One measurable failed component

Replace-first when:
- Visible rust or leaks
- Repeated failures
- Aging tank with stacked symptoms

Hard truth:
If you are stacking repairs, you are already in replacement territory.

---

## PUBLISH VALIDATOR CHECKLIST (SELF-CHECK BEFORE YOU OUTPUT JSON)

Before a page can publish, make it pass these checks:

### PUBLISH FAIL CONDITIONS

1. Field Triage contains fix/action language (replace, repair, flush, install, call, check, reset, schedule, hire) → FAIL
2. Field Triage uses abstract framework labels ("control class", "mechanical class", internal-only jargon) **or** is not built from observable user scenarios → FAIL
3. When \`summary_30s.flow_lines\` is non-empty (triage scan), it has fewer than **3** or more than **5** lines **or** any line does not follow **observable scenario → likely failure type** → FAIL
4. "What This Means" does not contain at least 3 arrows (→) → FAIL
5. "What This Means" contains generic phrases like: system is not functioning / serious issues / major failure if not addressed → FAIL
6. Page lacks a clear **hard truth** / decision-pressure line (repair vs replace tail, risk_warning, or final_warning) → FAIL
7. Urgency is **vague** ("this could be bad") **or** **exaggerated** / catastrophic without physical chain → FAIL
8. **Electrical** pages: no heat/current/arc or breaker-as-protection positioning where the symptom warrants it, **or** repeated trips framed as normal nuisance → FAIL
9. "Diagnostic Flow" does not contain at least 3 IF branches → FAIL
10. "Common Misdiagnosis" section missing → FAIL
11. "Common Misdiagnosis" has fewer than 4 bullet items → FAIL
12. "Repair vs Replace" missing: one jury-rigging / temporary-fix example, repair-first rules, replace-first rules, one hard-truth line → FAIL
13. Quick Checks intro longer than 1 short paragraph → FAIL
14. Page repeats the same urgency warning 3+ times with no new info → FAIL
15. Output reads like a general article instead of a decision tool → FAIL
16. \`internal_links\` missing / malformed, or \`related_symptoms\` length not in **3–5** → FAIL
17. **Three-segment job:** fewer than **2** \`related_symptoms\` entries share this job’s **trade** and **city \`*-fl\` tail** → FAIL
18. No \`related_symptoms\` entry is a **different city** on the same trade **or** a **two-segment** same-trade system/primer path (when a national bridge is required) → FAIL
19. Any \`related_symptoms\` entry crosses trades, is empty, is only \`/\`, or duplicates the same path twice → FAIL
20. **Localized electrical + Lee grid** (\`electrical/*/*-fl\`): \`related_symptoms\` omits \`electrical/breaker-keeps-tripping/fort-myers-fl\` when the job slug is **not** that path → FAIL

### THE REAL ISSUE IN YOUR CURRENT PAGE

The latest version still has triage using framework language or sneaking in actions, urgency that is either mushy or overheated with no physics chain, missing hard-truth pressure, "What This Means" staying generic, diagnostic flow mixing checklist with commentary, or a thin Common Misdiagnosis section.

### NEXT MOVE

Run the same page one more time after adding the hard rules: regenerate JSON that obeys every rule above, then output only the JSON object.
`.trim();
