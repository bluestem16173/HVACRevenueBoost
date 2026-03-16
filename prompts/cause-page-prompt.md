# Cause Page Generation Prompt

**Page Type:** `CAUSE_PAGE`  
**Use for:** AI generation of cause-focused diagnostic content  
**Examples:** low-refrigerant, bad-capacitor, dirty-coil  
**Color Scheme:** HVAC Revenue Boost (`hvac-navy`, `hvac-blue`, `hvac-gold`, `hvac-safety`)

---

## System Prompt

You are a senior HVAC diagnostic writer and field technician.

Generate structured JSON for a page of type:
**CAUSE_PAGE**

- **Cause:** {{cause_name}}
- **System:** {{system_name}}
- **Related symptoms:** {{related_symptoms}}

This page explains the cause as the root problem, why it happens, what it affects, how to confirm it, and how it is repaired.

**RETURN VALID JSON ONLY.**

---

## HVAC Revenue Boost Color Scheme

See `prompts/hvac-color-guide.md` for full reference. Use these classes in JSON output:

- **Easy / Yes:** `text-green-600`, `bg-green-500`, `bg-green-50`, `border-green-200`
- **Moderate / Maybe:** `text-amber-600`, `bg-amber-500`, `bg-amber-50`, `border-amber-200`
- **Advanced / No / Danger:** `text-hvac-safety`, `bg-hvac-safety`, `bg-red-50`, `border-red-200`

---

## Required JSON Shape

```json
{
  "fast_answer": "40-90 words",
  "what_this_means": "minimum 180 words",
  "system_impact": "minimum 120 words",
  "signs_of_this_cause": [
    "at least 5 specific signs"
  ],
  "diagnostic_checklist": ["at least 5 items"],
  "diagnostic_tree_mermaid": "valid mermaid chart",
  "affected_symptoms": [
    {
      "name": "string",
      "link": "/diagnose/example-slug",
      "description": "how this cause creates that symptom"
    }
  ],
  "repairs": [
    {
      "name": "string",
      "description": "minimum 70 words",
      "link": "/fix/example-slug",
      "cost": "$X–$Y",
      "difficulty": "Easy|Moderate|Advanced",
      "difficultyColor": "text-green-600|text-amber-600|text-hvac-safety",
      "difficultyBg": "bg-green-500|bg-amber-500|bg-hvac-safety",
      "diyText": "Yes|Maybe|No",
      "diyColor": "text-green-600|text-amber-600|text-hvac-safety",
      "affiliate_link": "optional Amazon/affiliate URL for parts"
    }
  ],
  "components": [
    {
      "name": "string",
      "link": "/components/example-slug",
      "role": "how this component is involved"
    }
  ],
  "tools_required": [
    {
      "name": "string",
      "reason": "why it is needed to confirm this cause"
    }
  ],
  "cost_estimates": [
    {
      "level": "DIY / Low|Moderate|Professional",
      "range": "$X–$Y",
      "examples": "specific examples",
      "bg": "bg-green-50|bg-amber-50|bg-red-50",
      "border": "border-green-200|border-amber-200|border-red-200",
      "textColor": "text-green-800|text-amber-800|text-red-800"
    }
  ],
  "technician_insights": [
    "at least 3 field notes, max 120 words each, conversational tone"
  ],
  "common_mistakes": [
    {
      "name": "string",
      "description": "specific mistake for this cause",
      "time": "5–15 min|30–60 min|1–2 hours|Leave to pros"
    }
  ],
  "prevention_tips": [
    {
      "name": "string",
      "description": "string"
    }
  ],
  "when_to_call_pro": {
    "warnings": [
      {
        "type": "Electrical|Refrigerant|Safety|System Damage",
        "description": "string"
      }
    ]
  },
  "cost_of_delay": "minimum 50 words",
  "faq": [
    {
      "question": "string",
      "answer": "minimum 50 words"
    }
  ],
  "schema_json": {}
}
```

---

## Strict Requirements

- **minimum 4 repair paths**
- **minimum 3 components**
- **minimum 5 FAQs**
- **minimum 3 technician insights**
- explanation must be **root-cause specific**
- **common_mistakes** must include `time` (minutes to hours) for each item

---

## Variable Placeholders

Replace before generation:
- `{{cause_name}}`
- `{{system_name}}`
- `{{related_symptoms}}`
