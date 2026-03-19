# Page Templates — LOCKED

**Status:** Canonical. Do not change section order without explicit approval.

---

## 1. Symptom Page Template (Money Pages)

**Route:** `/diagnose/[slug]`

### Section Order (Final)

| # | Section | Required | Notes |
|---|---------|----------|-------|
| 1 | **Hero** | ✅ | H1: "{Symptom Name}", 2–3 sentence intro |
| 2 | **Primary HVAC Diagram** | ✅ | Always. `SystemOverviewBlock` — thermostat, indoor/outdoor unit, ductwork |
| 3 | **2–3 Sentence Explanation** | ✅ | Summary / Fast Answer — what’s wrong, what to do next |
| 4 | **Conditional Diagram** | ⚙️ | AC Cycle OR Heat Pump OR RV — based on symptom context |
| 5 | **System Cards** | ✅ | 4 pillars: Electrical, Mechanical, Chemical (refrigerant), Structural (ducts) |
| 6 | **Cause List** | ✅ | Top 4–6 causes with difficulty, DIY/pro |
| 7 | **Repair Matrix** | ✅ | Repair | Difficulty | Cost | DIY? |
| 8 | **CTA** | ✅ | Get Local HVAC Quotes / Connect With Pro |

### Conditional Diagram Logic

- **AC Cycle** — default for cooling symptoms (ac-blowing-warm-air, ice-on-outdoor-unit, etc.)
- **Heat Pump** — when symptom slug contains `heat-pump`
- **RV** — when symptom is in RV context (hub/rv-ac) or slug contains `rv`

---

## 2. Cause Page Template

**Route:** `/cause/[slug]`

### Section Order

1. Hero (Cause name + context)
2. System Overview Block (variant: cause)
3. Fast Answer / Technical Breakdown
4. Symptoms This Cause Creates
5. Repair Options
6. CTA

---

## 3. Repair Page Template

**Route:** `/fix/[slug]`

### Section Order

1. Hero (How to {Repair})
2. System Overview Block (variant: repair)
3. Thirty-Second Summary
4. Fast Answer
5. What This Fixes
6. Steps / Tools / Parts
7. Cost
8. CTA

---

## Symptom AI Schema (LOCKED — Production)

**Prompt:** `SYMPTOM_PROMPT_LOCKED`  
**Schema:** `SYMPTOM_SCHEMA_LOCKED`  
**Minimal token. No Mermaid, FAQs, or summaries. Max 2 issues per system.**

```json
{
  "title": "",
  "quick_answer": "",
  "systems": [
    {
      "name": "Electrical | Mechanical | Chemical | Structural",
      "issues": [
        {
          "cause": "",
          "signs": "",
          "check": "",
          "fix": "",
          "difficulty": "Easy | Moderate | Hard",
          "pro_required": true
        }
      ]
    }
  ],
  "top_causes": ["", "", ""],
  "when_to_call_pro": ""
}
```

**Field mapping:** signs (was symptoms), check (was diagnosis), fix (was repair), pro_required (was professional_required).

## Image Logic (getImageForPage)

```ts
// lib/image-for-page.ts
if (slug.includes("rv")) return "/images/hvac_rv_system.svg.svg";
if (slug.includes("mini-split")) return "/images/hvac_mini_split.svg.svg";
if (slug.includes("heat-pump")) return "/images/hvac_heat_pump.svg.svg";
if (slug.includes("airflow") || slug.includes("room-hot")) return "/images/hvac_airflow_duct.svg.svg";
if (slug.includes("cooling") || slug.includes("not-cold") || slug.includes("warm-air")) return "/images/hvac_ac_cycle.svg.svg";
return "/images/hvac_system_main.svg.svg";
```

## Generation Flow

Seed `generation_queue` with `(type, slug)` e.g. `('symptom', 'ac-not-cooling')`. Worker uses LOCKED prompt + schema.
