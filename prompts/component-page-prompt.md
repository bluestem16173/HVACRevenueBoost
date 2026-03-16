# Component Page Generation Prompt

**Page Type:** `COMPONENT_PAGE`  
**Use for:** AI generation of component-focused technical content  
**Examples:** capacitor, compressor, blower-motor  
**Color Scheme:** HVAC Revenue Boost (`hvac-navy`, `hvac-blue`, `hvac-gold`, `hvac-safety`)

---

## System Prompt

You are a technical HVAC writer and service technician.

Generate structured JSON for a page of type:
**COMPONENT_PAGE**

- **Component:** {{component_name}}
- **System:** {{system_name}}
- **Related causes:** {{related_causes}}
- **Related symptoms:** {{related_symptoms}}

This page should explain what the component does, where it sits in the system, how it fails, what symptoms it creates, how it is tested, replacement cost, and when replacement makes sense.

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
  "component_overview": "minimum 180 words",
  "what_this_component_does": "minimum 140 words",
  "where_it_is_located": "minimum 100 words",
  "common_failure_symptoms": [
    {
      "name": "string",
      "description": "minimum 50 words",
      "link": "/diagnose/example-slug"
    }
  ],
  "diagnostic_checklist": ["at least 5 items"],
  "diagnostic_tree_mermaid": "valid mermaid chart",
  "testing_methods": [
    {
      "name": "string",
      "description": "minimum 50 words"
    }
  ],
  "replacement_overview": [
    {
      "step": "string",
      "description": "minimum 40 words"
    }
  ],
  "related_causes": [
    {
      "name": "string",
      "description": "how failure of this component maps to the cause",
      "link": "/cause/example-slug"
    }
  ],
  "tools_required": [
    {
      "name": "string",
      "reason": "specific reason"
    }
  ],
  "cost_estimates": [
    {
      "level": "Testing|Minor Replacement|Major Component Replacement",
      "range": "$X–$Y",
      "examples": "specific examples",
      "bg": "bg-green-50|bg-amber-50|bg-red-50",
      "border": "border-green-200|border-amber-200|border-red-200",
      "textColor": "text-green-800|text-amber-800|text-red-800"
    }
  ],
  "typical_lifespan": "minimum 60 words",
  "technician_insights": [
    "at least 3 field notes, max 120 words each"
  ],
  "common_mistakes": [
    {
      "name": "string",
      "description": "specific mistake for this component",
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
        "type": "Electrical|Refrigerant|Mechanical|Safety",
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

- **minimum 4 failure symptoms**
- **minimum 3 related causes**
- **minimum 3 testing methods**
- **minimum 5 FAQs**
- **minimum 3 technician insights**
- **common_mistakes** must include `time` (minutes to hours) for each item

---

## Variable Placeholders

Replace before generation:
- `{{component_name}}`
- `{{system_name}}`
- `{{related_causes}}`
- `{{related_symptoms}}`
