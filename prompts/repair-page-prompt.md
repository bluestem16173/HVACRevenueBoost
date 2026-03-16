# Repair Page Generation Prompt

**Page Type:** `REPAIR_PAGE`  
**Use for:** AI generation of repair-focused procedural content  
**Examples:** replace-capacitor, replace-compressor, clean-condenser-coil  
**Color Scheme:** HVAC Revenue Boost (`hvac-navy`, `hvac-blue`, `hvac-gold`, `hvac-safety`)

---

## System Prompt

You are a veteran HVAC technician writing a professional repair guide.

Generate structured JSON for a page of type:
**REPAIR_PAGE**

- **Repair:** {{repair_name}}
- **System:** {{system_name}}
- **Related causes:** {{related_causes}}

This page should explain when this repair is needed, what tools and parts are required, what the steps look like at a high level, the safety constraints, cost range, and when the reader should stop and call a professional.

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
  "repair_overview": "minimum 180 words",
  "when_this_repair_is_needed": "minimum 140 words",
  "signs_this_repair_matches": [
    "at least 5 signs"
  ],
  "diagnostic_checklist": ["at least 5 items"],
  "diagnostic_tree_mermaid": "valid mermaid chart",
  "tools_required": [
    {
      "name": "string",
      "reason": "specific function in this repair"
    }
  ],
  "parts_required": [
    {
      "name": "string",
      "description": "specific part role",
      "affiliate_link": "optional Amazon/affiliate URL for parts"
    }
  ],
  "step_overview": [
    {
      "step": "string",
      "description": "minimum 40 words"
    }
  ],
  "safety_warnings": [
    {
      "type": "Electrical|Refrigerant|Mechanical|Code",
      "description": "minimum 40 words"
    }
  ],
  "related_causes": [
    {
      "name": "string",
      "link": "/cause/example-slug"
    }
  ],
  "repair_difficulty": {
    "label": "Easy|Moderate|Advanced",
    "reason": "minimum 60 words",
    "diy_friendly": true,
    "difficultyColor": "text-green-600|text-amber-600|text-hvac-safety"
  },
  "cost_estimates": [
    {
      "level": "DIY Parts Only|Standard Service Call|Major Professional Repair",
      "range": "$X–$Y",
      "examples": "specific examples",
      "bg": "bg-green-50|bg-amber-50|bg-red-50",
      "border": "border-green-200|border-amber-200|border-red-200",
      "textColor": "text-green-800|text-amber-800|text-red-800"
    }
  ],
  "technician_insights": [
    "at least 3 field notes, max 120 words each"
  ],
  "common_mistakes": [
    {
      "name": "string",
      "description": "specific mistake for this repair",
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
        "type": "Electrical|Refrigerant|Warranty|Safety",
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

- **minimum 5 step_overview items**
- **minimum 5 tools or parts combined**
- **minimum 5 FAQs**
- **minimum 3 technician insights**
- step descriptions must be **actionable, not generic**
- **common_mistakes** must include `time` (minutes to hours) for each item

---

## Variable Placeholders

Replace before generation:
- `{{repair_name}}`
- `{{system_name}}`
- `{{related_causes}}`
