# Master Prompt Architecture — Production-Grade

This document describes the hierarchical prompt system for scaling HVAC Revenue Boost, DecisionGrid, RV, and other knowledge sites to 50k+ pages.

## Overview

```
MASTER SYSTEM PROMPT
        +
PAGE-TYPE PROMPT (symptom | condition | cause | repair | component)
        +
CONTEXT INJECTION (dynamic data from DB)
        ↓
STRUCTURED JSON OUTPUT
```

## 1. Master System Prompt

**File:** `prompts/master-system-prompt.md`  
**Purpose:** Injected into every page generator. Core philosophy, constraints, and output requirements.

**Key principles:**
- Technically correct
- Structured for diagnostic workflows
- Optimized for SEO and knowledge graphs
- Actionable (cost, time, safety flags

**Flow:** Diagnose first → Explain root cause → Provide repair options → Estimate costs → Prevent recurrence

## 2. Page Types

| Page Type | Purpose | Prompt File |
|-----------|---------|-------------|
| `system` | Authority pillar | `system-page-prompt.md` |
| `symptom` | Main traffic pages | `symptom-page-prompt.md` |
| `symptom_condition` | Diagnostic branching | `symptom-condition-page-prompt.md` |
| `cause` | Technical explanation | `cause-page-prompt.md` |
| `repair` | How-to repair | `repair-page-prompt.md` |
| `component` | Parts + affiliate | `component-page-prompt.md` |
| `location_hub` | Lead generation | `location-hub-page-prompt.md` |
| `diagnostic` | Diagnostic guide | `diagnostic-guide-page-prompt.md` |

## 3. Mermaid Rules

**File:** `prompts/mermaid-rules.md`

**Diagram 1 — Symptom Verification:** Yes/no questions to narrow causes  
**Diagram 2 — Root Cause Tree:** Flat tree (symptom → causes)

## 4. SQL Structure (Scalability)

Junction tables enable scaling:

- `symptom_causes` — symptom_id, cause_id
- `symptom_conditions` — symptom_id, condition_id
- `condition_causes` — condition_id, cause_id
- `cause_repairs` — cause_id, repair_id

**Example scale:** 150 symptoms × 20 conditions × 6 causes × 5 repairs = 90,000 potential pages (following the graph, not spam).

## 5. Worker Generation Logic

```text
for each symptom    → generate symptom page
for each condition  → generate condition page
for each cause      → generate cause page
for each repair     → generate repair page
```

## 6. Cost Control

- **Model:** gpt-4o-mini
- **Approx cost per page:** $0.002–0.006
- **1000 pages/day:** ~$2–6/day

## 7. Authority Hub Pages

Generate hub pages for SEO:

- `/rv-hvac`
- `/home-hvac`
- `/rv-electrical`
- `/rv-water`

Each hub organizes: symptoms, conditions, repairs, components.

## 8. Implementation

- **Master loader:** `prompts/master.ts` → `getMasterSystemPrompt()`
- **Compose:** `lib/ai-generator.ts` → `composeSystemPrompt(pageTypePrompt)`
- **Registry:** `prompts/index.ts` → `getPromptByPageType()`, `composePromptForPageType()`
