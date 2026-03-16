# Symptom Page Generation Prompt

**Page Type:** `SYMPTOM_PAGE`  
**Use for:** AI generation of symptom-focused diagnostic content  
**Examples:** ac-not-cooling, ac-blowing-warm-air, ac-freezing-up  
**Color Scheme:** HVAC Revenue Boost (`hvac-navy`, `hvac-blue`, `hvac-gold`, `hvac-safety`)

---

## Task

Generate a diagnostic guide for the following symptom.

- **SYSTEM:** {{system_name}}
- **SYMPTOM:** {{symptom_name}}
- **LOCATION:** {{location}} (optional)

Content must include these 14 sections in order:

1. **Fast Answer** — 1–2 sentences, immediate diagnostic summary
2. **30 Second Summary** — Slightly expanded, actionable
3. **Diagnostic Flowchart** — Mermaid (symptom verification: yes/no questions)
4. **What This Problem Usually Means** — 2–4 sentences
5. **Root Cause Flowchart** — Mermaid (symptom → causes tree)
6. **Common Causes Table** — Min 3 causes with difficulty, cost, DIY friendly
7. **Field Technician Insight** — 50–75 words, conversational, with citation (ASHRAE, EPA, etc.)
8. **Repair Options** — Easy → advanced, with DIY rank, safety, cost, time
9. **Typical Repair Costs** — Low / moderate / professional ranges
10. **DIY Toolkit** — Tools required (min 4), with placeholder for affiliate links
11. **Prevention Tips** — Ounce of prevention, pound of cure
12. **When To Call Technician** — Electrical, refrigerant, gas warnings
13. **Related Guides** — 3–6 related symptom/condition pages
14. **FAQ** — Min 4 questions with 50+ word answers

---

## Mermaid Rules

See `prompts/mermaid-rules.md`. Produce two diagrams:

- **Diagram 1 (diagnostic_flowchart):** Symptom verification with yes/no questions
- **Diagram 2 (root_cause_flowchart):** Flat tree: symptom → causes

---

## JSON Output Schema

```json
{
  "fast_answer": "string",
  "summary_30_sec": "string",
  "diagnostic_flowchart": "mermaid string",
  "root_cause_flowchart": "mermaid string",
  "causes": [
    {
      "name": "string",
      "symptoms": "string",
      "explanation": "string",
      "repair_options": []
    }
  ],
  "repair_costs": [],
  "tools_needed": [],
  "technician_insights": ["string", "string"],
  "field_note": "string",
  "prevention_tips": [],
  "when_to_call_pro": { "warnings": [] },
  "faq": []
}
```

---

## Variable Placeholders

Replace before generation:

- `{{symptom_name}}`
- `{{system_name}}`
- `{{location}}`

---

## HVAC Revenue Boost Color Scheme

See `prompts/hvac-color-guide.md`:

- **Easy / Yes:** `text-green-600`, `bg-green-50`, `border-green-200`
- **Moderate:** `text-amber-600`, `bg-amber-50`, `border-amber-200`
- **Advanced / Pro Only:** `text-hvac-safety`, `bg-red-50`, `border-red-200`

**RETURN VALID JSON ONLY.** No markdown, no explanations.
