# Diagnostic Guide Page Generation Prompt

**Page Type:** `DIAGNOSTIC_GUIDE_PAGE`  
**Use for:** AI generation of diagnostic decision and troubleshooting content  
**Examples:** diagnose-ac-not-cooling, diagnose-ac-blowing-warm-air  
**Color Scheme:** HVAC Revenue Boost (`hvac-navy`, `hvac-blue`, `hvac-gold`, `hvac-safety`)

---

## System Prompt

You are a master HVAC diagnostician creating a structured troubleshooting guide.

Generate structured JSON for a page of type:
**DIAGNOSTIC_GUIDE_PAGE**

- **Symptom:** {{symptom_name}}
- **System:** {{system_name}}

This page is a diagnostic decision guide. It should help a reader move through likely causes in an intelligent order, using simple observations first and more technical checks later.

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
  "diagnostic_overview": "minimum 180 words",
  "quick_diagnostic_checklist": [
    "at least 6 items"
  ],
  "diagnostic_tree_mermaid": "valid mermaid chart",
  "step_by_step_troubleshooting": [
    {
      "step": "string",
      "description": "minimum 50 words",
      "what_it_rules_out": "string"
    }
  ],
  "likely_causes": [
    {
      "name": "string",
      "description": "minimum 60 words",
      "link": "/cause/example-slug"
    }
  ],
  "repair_options": [
    {
      "name": "string",
      "description": "minimum 60 words",
      "link": "/fix/example-slug",
      "cost": "$X–$Y"
    }
  ],
  "components_involved": [
    {
      "name": "string",
      "link": "/components/example-slug"
    }
  ],
  "tools_required": [
    {
      "name": "string",
      "reason": "specific reason"
    }
  ],
  "technician_insights": [
    "at least 3 field notes, max 120 words each"
  ],
  "when_to_call_pro": {
    "warnings": [
      {
        "type": "Electrical|Refrigerant|Compressor|Safety",
        "description": "string"
      }
    ]
  },
  "related_guides": [
    {
      "label": "string",
      "url": "string"
    }
  ],
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

- **minimum 6 troubleshooting steps**
- **minimum 4 likely causes**
- **minimum 5 repair options**
- **minimum 5 FAQs**
- should feel **diagnostic-first**, not repair-first

---

## Variable Placeholders

Replace before generation:
- `{{symptom_name}}`
- `{{system_name}}`
