# Render Hardening — Implementation Checklist

## Architecture

```
DB JSON → normalizePageData() → pageViewModel → resolvePageSections() → React templates
```

**No raw DB JSON in templates.** All content flows through the translator.

---

## A. Translator Layer ✅

| File | Status |
|------|--------|
| `lib/content/normalizePageData.ts` | ✅ Handles symptom, cause, repair |
| `lib/content/safeHelpers.ts` | ✅ toSafeString, toStringArray, toObjectArray, normalizeCauseCards, normalizeFaqItems, normalizeToolOrPartItems, normalizeRepairSteps |
| `lib/content/pageViewModels.ts` | ✅ BasePageViewModel, repair-specific fields |
| Page type detection | ✅ detectPageType() in resolvePageSections |
| Compatibility | ✅ Legacy strings, mixed arrays, graph fallbacks |

---

## B. Section Resolver Layer ✅

| File | Status |
|------|--------|
| `lib/content/resolvePageSections.ts` | ✅ Page-type-aware |
| PAGE_TYPE_LAYOUTS | ✅ symptom, cause, repair, condition |
| Safe fallbacks | ✅ try/catch in resolveSectionData, null for missing |

---

## C. Component Refactor ✅

| Template | Uses pageViewModel | Safe Fallbacks |
|----------|-------------------|----------------|
| SymptomPageTemplate | ✅ | ✅ |
| CausePageTemplate | ✅ | ✅ |
| RepairPageTemplate | ✅ | ✅ |
| Condition page | Inline (static graph) | ✅ toSafeString for r.component |

---

## D. Symptom Page ✅

- Section order per MASTER-PROMPT
- "Common Causes & Possible Fixes" → "Top Causes (Ranked by Likelihood)"
- Guided filters → "Narrow Down the Problem"
- Mermaid disabled (steps placeholder)

---

## E. Repair Page ✅

- Fix route: fetches AI content, calls normalizePageData
- Repair template: pageViewModel only
- graphTools fallback when raw has no tools
- Placeholder when repair steps missing

---

## F. Cause Page ✅

- Cause route: normalizePageData with legacyHtmlContent
- No dangerouslySetInnerHTML
- bodyText from stripped HTML

---

## G. Condition Page ✅

- Safe toSlug for r.component (no .replace on unknown)
- Uses static graph data (no DB content)

---

## H. Safe Defaults ✅

| Scenario | Behavior |
|----------|----------|
| Missing ranked causes | Hide section |
| Missing diagnostic flow | Placeholder copy |
| Missing FAQ | Omit section |
| Malformed cause object | Skip invalid card (normalizeCauseCards filters) |
| Unknown page type | diagnostic_first layout |
| tools/parts empty | Use graphTools or DEFAULT_TOOLS |

---

## I. Backward Compatibility ✅

| Legacy format | Handler |
|---------------|---------|
| content_json as string | JSON.parse in route |
| html_content | stripHtmlToText → bodyText |
| causes: ["string"] | normalizeCauseCards → toObjectArray handles |
| diagnostic_checklist: ["s1","s2"] | toStringArray |
| diagnostic_steps: [{action}] | toStringArray / normalizeRepairSteps |
| Mixed string/object arrays | toObjectArray, toStringArray |

---

## J. Hydration Safety ✅

- No browser-only rendering in server components
- No random object-to-string coercion (toSafeString)
- No unknown nested structures (typed view model)
- No dangerouslySetInnerHTML for DB content
- Server-safe normalization only

---

## Canary Generation Readiness

After this implementation:

1. Generator outputs structured JSON per GENERATOR-OUTPUT-CONTRACTS.md
2. normalizePageData maps all page types
3. Templates consume pageViewModel exclusively
4. Old pages still render (compatibility layer)
5. New pages render with full structure
