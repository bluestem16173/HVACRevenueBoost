# Generator Output Contracts — Frontend-Oriented Schemas

All generated content MUST align with these normalized schemas. The frontend translator layer (`lib/content/normalizePageData`) maps raw DB JSON to typed view models. Prefer structured fields over HTML/string blobs.

**NEVER** store or render raw HTML from the database. Use `stripHtmlToText` for legacy HTML → plain text.

---

## Symptom Pages

```json
{
  "pageType": "symptom",
  "slug": "ac-blowing-warm-air",
  "title": "AC Blowing Warm Air: Causes & Fixes",
  "fastAnswer": "Your AC is blowing warm air most commonly due to low refrigerant, a failed capacitor, or dirty coils.",
  "summary30": "If your AC is running but not cooling, start by checking airflow issues like filters and coils, then electrical components like capacitors, and finally refrigerant levels.",
  "diagnostic_checklist": ["Check thermostat settings", "Inspect air filter", "Reset HVAC breaker"],
  "diagnostic_steps": [
    { "step": 1, "action": "Check thermostat settings", "expected_result": "System set to cool" },
    { "step": 2, "action": "Inspect air filter", "expected_result": "Clean and unobstructed" }
  ],
  "filters": { "categories": [
    { "name": "Environment", "options": [{ "slug": "extreme-heat", "label": "Extreme Heat" }] },
    { "name": "Conditions", "options": [{ "slug": "weak-airflow", "label": "Weak Airflow" }] }
  ]},
  "causesTable": [
    { "name": "Low refrigerant", "indicator": "Warm air, ice on lines", "confidence": "high", "difficulty": "Moderate", "cost": "$200–$600" },
    { "name": "Bad capacitor", "indicator": "Clicking sound, fan not spinning", "confidence": "medium" }
  ],
  "rankedCauses": [
    { "name": "Low refrigerant", "indicator": "Warm air, ice on lines", "repairs": [{ "name": "Recharge refrigerant", "difficulty": "professional", "cost": "$200–$600" }] }
  ],
  "repairOptions": [
    { "name": "Recharge refrigerant", "difficulty": "professional", "estimated_cost": "$200–$600" },
    { "name": "Replace capacitor", "difficulty": "moderate", "estimated_cost": "$120–$300" }
  ],
  "faq": [
    { "question": "Why is my AC running but not cooling?", "answer": "Usually due to airflow restrictions, refrigerant issues, or electrical component failure." }
  ],
  "when_to_call_pro": { "warnings": [{ "type": "Electrical", "description": "Contactors require LOTO training." }] }
}
```

---

## Cause Pages

```json
{
  "pageType": "cause",
  "slug": "low-refrigerant",
  "fastAnswer": "Low refrigerant indicates a leak. EPA Section 608 certification required for handling.",
  "whatThisCauseMeans": "Refrigerant circulates through the system; low levels mean a leak or undercharge.",
  "commonSymptoms": [
    { "name": "AC blowing warm air", "slug": "ac-blowing-warm-air", "link": "/diagnose/ac-blowing-warm-air" },
    { "name": "AC freezing up", "slug": "ac-freezing-up" }
  ],
  "confirmTests": [
    { "step": 1, "action": "Check subcooling/superheat", "expected_result": "Readings outside normal range" }
  ],
  "repairOptions": [
    { "name": "Leak repair and recharge", "difficulty": "professional", "estimated_cost": "$200–$600" }
  ],
  "faq": [
    { "question": "Can I add refrigerant myself?", "answer": "No. EPA Section 608 certification is required." }
  ]
}
```

**Legacy:** If `html_content` exists in DB, the translator strips it to plain text and stores in `bodyText`. Never render as HTML.

---

## Repair Pages

```json
{
  "pageType": "repair",
  "slug": "replace-capacitor",
  "fastAnswer": "Capacitor replacement restores fan/compressor operation. Discharge before handling.",
  "whatThisRepairDoes": "Replaces failed run capacitor that stores charge for motor startup.",
  "difficulty": "moderate",
  "toolsNeeded": [
    { "name": "Multimeter", "purpose": "Test capacitance and verify discharge" },
    { "name": "Capacitor discharge tool", "purpose": "Safe discharge before removal" }
  ],
  "partsNeeded": [
    { "name": "Run capacitor", "description": "Match microfarad and voltage rating" }
  ],
  "repairStepsOverview": [
    { "step": 1, "action": "Turn off power and discharge capacitor" },
    { "step": 2, "action": "Remove old capacitor, note wire positions" },
    { "step": 3, "action": "Install new capacitor, restore power" }
  ],
  "whenNotToDiy": ["High voltage present", "Dual capacitor with unknown wiring"],
  "relatedSymptoms": [{ "name": "AC not turning on", "slug": "ac-not-turning-on" }],
  "faq": [
    { "question": "What size capacitor do I need?", "answer": "Match the microfarad (µF) and voltage rating on the old unit." }
  ]
}
```

---

## Condition Pages

```json
{
  "pageType": "condition",
  "slug": "weak-airflow-extreme-heat",
  "fastAnswer": "Weak airflow during extreme heat often indicates dirty filter, restricted duct, or undersized system.",
  "conditionSummary": "Scenario-specific: system under peak load with reduced airflow.",
  "filters": { "categories": [
    { "name": "Environment", "options": [{ "slug": "extreme-heat", "label": "Extreme Heat" }] }
  ]},
  "likelyCauses": [
    { "name": "Dirty air filter", "indicator": "Reduced CFM at vents" },
    { "name": "Restricted ductwork", "indicator": "Some rooms cooler than others" }
  ],
  "recommendedRepairs": [
    { "name": "Replace filter", "difficulty": "easy", "cost": "$20–$50" }
  ],
  "faq": [
    { "question": "Why does airflow drop in heat?", "answer": "Higher load increases static pressure; dirty filter worsens it." }
  ]
}
```

---

## Rules

1. **All arrays use object structure** — no bare strings in arrays.
2. **All text fields are strings** — no numbers where strings expected.
3. **No null** — use empty array `[]` or omit optional fields.
4. **No HTML** — store plain text or structured JSON only.
5. **Consistent naming** — use `slug`, `name`, `label` per schema.
