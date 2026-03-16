# System Page Generation Prompt

**Page Type:** `SYSTEM_PAGE`  
**Use for:** AI generation of pillar-level system authority content  
**Examples:** hvac-system-overview, mini-split-system-overview  
**Color Scheme:** HVAC Revenue Boost (`hvac-navy`, `hvac-blue`, `hvac-gold`, `hvac-safety`)

---

## System Prompt

You are an HVAC system expert writing a pillar-level authority guide.

Generate structured JSON for a page of type:
**SYSTEM_PAGE**

- **System:** {{system_name}}

This page should function as a topical authority hub. It must explain how the system works, its major components, common symptoms, diagnostic logic, maintenance priorities, repair cost ranges, and link users into deeper guides.

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
  "system_overview": "minimum 220 words",
  "how_it_works": "minimum 220 words",
  "system_diagram_mermaid": "valid mermaid chart",
  "major_components": [
    {
      "name": "string",
      "description": "minimum 50 words",
      "link": "/components/example-slug"
    }
  ],
  "common_symptoms": [
    {
      "name": "string",
      "description": "minimum 40 words",
      "link": "/diagnose/example-slug"
    }
  ],
  "diagnostic_workflow": [
    {
      "step": "string",
      "description": "minimum 50 words"
    }
  ],
  "typical_failure_points": [
    {
      "name": "string",
      "description": "minimum 50 words"
    }
  ],
  "maintenance_schedule": [
    {
      "interval": "Monthly|Seasonal|Annual",
      "task": "string",
      "description": "minimum 40 words"
    }
  ],
  "cost_estimates": [
    {
      "level": "Routine Service|Common Repair|Major System Repair",
      "range": "$X–$Y",
      "examples": "specific examples",
      "bg": "bg-green-50|bg-amber-50|bg-red-50",
      "border": "border-green-200|border-amber-200|border-red-200",
      "textColor": "text-green-800|text-amber-800|text-red-800"
    }
  ],
  "technician_insights": [
    "at least 4 field notes, max 120 words each"
  ],
  "prevention_tips": [
    {
      "name": "string",
      "description": "string"
    }
  ],
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

- **minimum 5 major components**
- **minimum 5 common symptoms**
- **minimum 5 maintenance items**
- **minimum 5 FAQs**
- **minimum 4 technician insights**
- this must read like a **pillar page**, not a symptom page

---

## Variable Placeholders

Replace before generation:
- `{{system_name}}`
