/**
 * Tier-1 national problem pillar — authority + HSD-style diagnostic voice.
 * Wired into {@link generateProblemPillarPage} before the V4 JSON appendix (mapper requires V4 root keys).
 */
export const HSD_TIER1_PILLAR = `
You are generating a Tier-1 Authority Diagnostic Page.

This page MUST combine:

1. HSD diagnostic reasoning (flow, triage, causes)
2. Tier-1 authority structure (decision tree, emergency block, repair matrix)

---

## CRITICAL DIFFERENCE FROM STANDARD HSD

This is NOT a local page.

This is the PRIMARY authority page for this problem.

It must:
- fully explain the system failure
- provide structured diagnostic reasoning
- act as the root node for all city pages

---

## PILLAR MODE (CRITICAL)

If this page is a national (non-city) page:

You MUST switch to AUTHORITY MODE.

---

### REQUIREMENTS

1. NO REPETITION

Do NOT use phrases like:
- "See diagnostic flow"
- "Check next section"

Each section must add new information.

---

2. FAILURE CLASS MODEL (MANDATORY)

You MUST group causes into 3 classes:

HVAC:
- Airflow failures
- Refrigerant / thermodynamic failures
- Electrical / control failures

Electrical:
- Supply failures
- Circuit failures
- Device failures

Plumbing:
- Supply failures
- Drainage failures
- Fixture failures

---

3. DIAGNOSTIC FLOW MUST BRANCH

NOT:

Step 1 → Step 2 → Step 3

BUT:

If airflow low → airflow path  
If airflow normal → refrigerant path  

(Adapt branching labels to the active trade — same idea for electrical/plumbing.)

---

4. TOP CAUSES MUST INCLUDE

- mechanism (why it fails)
- fix (what resolves it)
- cost range
- escalation risk

---

5. REPAIR MATRIX MUST BE REAL

NOT:

"Call professional"

BUT:

Symptom → failure class → fix → cost

---

6. SYSTEM EXPLANATION (REQUIRED)

Explain:

- how the system actually works
- what physically breaks
- why those failures occur

---

7. DIAGNOSTIC TONE

Write like:

"Here's how this actually fails in the field"

NOT:

"Here are some possible causes"

---

8. CTA

Must feel like:

"You're past safe DIY—stop guessing"

NOT marketing language

---

9. NO GENERIC CONTENT

If output feels like a blog post → it is wrong.

This must feel like a technician's diagnostic system.

---

10. EMERGENCY / ESCALATION BLOCK (REQUIRED)

Include a clearly differentiated risk block that states:
- the failure condition that requires immediate stop or escalation
- the likely damage path if operation continues
- the typical cost jump when ignored
- the point where DIY should stop immediately

This must be trade-specific:

HVAC → icing, compressor strain, burning smell, no airflow under load

Electrical → heat, buzzing, burning smell, repeated breaker trips, arcing

Plumbing → active leak spread, sewer backup, no shutoff control, pressure loss

---

### ALSO — INTERNAL LINKING (MASTER ADD-ON, LOCKED)

- Every page MUST support the on-site **Related** graph. In the JSON contract you emit, populate **`internalLinks.related`** (and **`internalLinks.system`** as needed) so there are **3–5** total internal targets where the schema allows, and they read as one Related band in product:
  - **≥2** = same **trade**, **different symptom** (national: 2-segment peers under the same vertical).
  - **≥1** = same symptom cluster **routed to a real city page** (3-segment `/{vertical}/{symptom}/{city-fl}` using cities from the brief) **or** a **system-level** same-trade pillar.
  - **Optional:** one extra same-trade root/system link.
- **Do not** link across trades, to the generic homepage only, or repeat the same URL twice to pad the list. If you cannot find 3 credible targets, the brief is incomplete — still **do not** invent impossible slugs.
- **If Related-style links are absent or obviously generic → output is INVALID.**

- Trade-specific triage must appear early and match the vertical.

---

## OUTPUT RULE

Return JSON matching dg_authority_v2 schema EXACTLY.

## MACHINE CONSTRAINT (DO NOT OMIT)

The appended "OUTPUT FORMAT (STRICT JSON)" block in the same user message defines the required root keys (hero, sections, repairMatrix, …) for the publish pipeline — use that object shape exactly.

---

Return ONLY JSON.
`.trim();
