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
14. Upgrade Paths
15. CTA

### FIELD TRIAGE RULES

- Field Triage MUST classify only.
- Field Triage MUST NOT include fixes, repairs, replacements, or recommendations.
- Each line must be: symptom state → likely failure class.
- Each line must be short.
- If any triage line includes phrases like "replace", "flush", "repair", "call", or "install", the output is invalid.
- **plumbing/no-hot-water:** \`summary_30s.core_truth\` must stay **classification framing** (why the scan lines exist). **Forbidden in core_truth:** consequence/threat openers like "Ignoring …", "can lead to …", "if left untreated …", or any paragraph that reads like a blog warning — those belong in \`risk_warning\`, \`final_warning\`, or cost sections, not stacked under the triage scan.

GOOD EXAMPLE:

No hot water at all?
→ Power loss or failed element

Water warm but not hot?
→ Partial element failure or thermostat issue

Hot water runs out fast?
→ Sediment limiting recovery

Rusty or discolored water?
→ Tank corrosion (replacement path)

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

### STYLE RULES

- Prefer short paragraphs and lists over long paragraphs.
- Use arrows (→) to show causality.
- Sound clinical, not dramatic.
- Sound urgent when risk is real, not everywhere.
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

### FIELD TRIAGE EXAMPLE

No hot water at all?
→ Power loss or failed element

Water warm but not hot?
→ Partial element failure or thermostat issue

Hot water runs out fast?
→ Sediment limiting recovery

Rusty or discolored water?
→ Tank corrosion (replacement path)

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

1. Field Triage contains: replace, repair, flush, install, call → FAIL
2. "What This Means" does not contain at least 3 arrows (→) → FAIL
3. "What This Means" contains generic phrases like: system is not functioning / serious issues / major failure if not addressed → FAIL
4. "Diagnostic Flow" does not contain at least 3 IF branches → FAIL
5. "Common Misdiagnosis" section missing → FAIL
6. "Common Misdiagnosis" has fewer than 4 bullet items → FAIL
7. "Repair vs Replace" missing: one jury-rigging / temporary-fix example, repair-first rules, replace-first rules, one hard-truth line → FAIL
8. Quick Checks intro longer than 1 short paragraph → FAIL
9. Page repeats the same urgency warning 3+ times with no new info → FAIL
10. Output reads like a general article instead of a decision tool → FAIL

### THE REAL ISSUE IN YOUR CURRENT PAGE

The latest version still has triage giving fixes, "What This Means" staying generic, diagnostic flow mixing checklist with commentary, and no Common Misdiagnosis section yet.

### NEXT MOVE

Run the same page one more time after adding the hard rules: regenerate JSON that obeys every rule above, then output only the JSON object.
`.trim();
