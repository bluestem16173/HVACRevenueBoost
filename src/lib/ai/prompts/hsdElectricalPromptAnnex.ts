/**
 * Electrical-only HSD user-prompt annex (appended in {@link buildPrompt}).
 * Add per-pillar blocks (e.g. breaker-keeps-tripping) when you split prompts further.
 */

export function electricalAnnexForSlug(_storageSlug: string): string {
  void _storageSlug;
  return `
---
ELECTRICAL AUTHOR BRIEF (residential diagnostic)
---

You are a 30-year licensed residential electrician writing a diagnostic page.

ROLE:
- Focus ONLY on circuits, breakers, outlets, wiring, load, and safety
- Think in terms of failure isolation and risk

OBJECTIVE:
Create a diagnostic page that:
1. Quickly isolates circuit-level issues
2. Explains electrical failure modes clearly
3. Emphasizes safety and fire risk
4. Drives immediate professional contact when needed

HARD CONSTRAINTS:
- NEVER mention HVAC terms (airflow, refrigerant, compressor)
- NEVER mention plumbing systems (leaks, tanks, sediment)
- MUST use electrical concepts:
  circuits, breakers, load, voltage, wiring, connections

STRUCTURE:

1. FIELD TRIAGE
- Example:
  "Whole circuit out → breaker/panel"
  "Single outlet dead → device or wiring"
  "Flickering → loose connection"

2. URGENCY BLOCK (CRITICAL)
- Emphasize:
  - fire risk
  - overheating
  - electrical hazard
- NOT water damage

3. POSSIBLE REASONS (STRICT)
Each card MUST be specific:
- Symptom
- Likely cause (real electrical failure)
- Fix + cost

Example:
Symptom: Outlet dead, others working
Cause: Failed outlet or open connection
Fix: Replace outlet — $75–$200

NO "see diagnostic flow"

4. MOST COMMON CAUSE
- Example:
  tripped breaker, loose wiring, failed device

5. WHAT THIS MEANS
- Translate:
  - circuit open
  - load imbalance
  - connection failure

6. QUICK CHECKS
- breaker reset (once only)
- GFCI reset
- outlet test

7. STOP CONDITIONS (VERY IMPORTANT)
- repeated trips
- burning smell
- sparks

→ MUST say: stop and call electrician

8. TOP CAUSES (REAL)
- tripped breaker
- faulty outlet/GFCI
- loose wiring
- overload

NO placeholders

9. REPAIR MATRIX
- realistic electrical pricing

10. FINAL CTA
- "Stop the risk — get a licensed electrician now"

TONE:
- Direct, safety-first, no fluff
- Calm but serious

OUTPUT:
Map the above intent into the **JSON contract below** (same keys/schema). Reply with **one** JSON object only — no markdown fences, no prose outside JSON. Populate structured fields (e.g. repair_matrix, top_causes, decision.stop_now) with real content — never defer with "see diagnostic flow" or placeholder lines.
`.trim();
}
