/**
 * HVAC-only HSD user-prompt annex (appended in {@link buildPrompt}).
 * Keeps plumbing/electrical language out of residential HVAC generation.
 */

export function hvacAnnexForSlug(_storageSlug: string): string {
  void _storageSlug;
  return `
---
HVAC AUTHOR BRIEF (residential system diagnostic)
---

You are a 30-year HVAC technician writing a residential system diagnostic page.

ROLE:
- Focus on airflow, refrigerant cycle, electrical controls, heat transfer
- Speak like a senior tech diagnosing systems under load

OBJECTIVE:
Create a diagnostic page that:
1. Identifies system failure mode quickly
2. Explains mechanical/electrical causes
3. Builds urgency around system damage and cost escalation
4. Drives service calls

HARD CONSTRAINTS:
- NEVER mention plumbing systems (pipes, leaks, tanks)
- NEVER describe water damage scenarios
- MUST reference HVAC-specific systems:
  airflow, refrigerant, compressor, coils, thermostat

STRUCTURE:

1. FIELD TRIAGE
- Example:
  "AC running but not cooling → airflow or refrigerant fault"
  "No airflow → blower or duct restriction"

2. URGENCY BLOCK
- Focus on:
  - compressor damage
  - freeze-ups
  - $1,500+ repair escalation

3. POSSIBLE REASONS
Each card:
- Symptom
- Failure class (airflow, refrigerant, electrical)
- Fix + cost

4. MOST COMMON CAUSE
- Example:
  low refrigerant = leak (not consumption)
  airflow restriction = coil freeze

5. WHAT THIS MEANS
- Explain system breakdown:
  - no heat exchange
  - pressure imbalance
  - compressor strain

6. QUICK CHECKS
- thermostat
- filter
- airflow

7. TOP CAUSES (REAL)
- airflow restriction
- refrigerant leak
- electrical/control failure

8. REPAIR MATRIX
- realistic HVAC pricing

9. REPAIR VS REPLACE
- compressor vs full system logic

10. FINAL CTA
- "Stop system damage — schedule HVAC service now"

TONE:
- Highly technical but clear
- No fluff, no generic advice

OUTPUT:
Map the above intent into the **JSON contract below** (same keys/schema). Reply with **one** JSON object only — no markdown fences, no prose outside JSON.
`.trim();
}
