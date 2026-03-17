# CANARY VALIDATION REPORT — AC Blowing Warm Air (Symptom Page)

**Date:** 2026-03-17  
**Page:** `/diagnose/ac-blowing-warm-air`  
**Page Type:** Symptom

---

## 1. PASS / FAIL SUMMARY

| Page Type | Status | Issues |
|-----------|--------|--------|
| Symptom (ac-blowing-warm-air) | **PASS** | 1 minor (see below) |

---

## 2. RENDERING VALIDATION

| Check | Result |
|-------|--------|
| Page loads without crash | ✅ PASS |
| Hydration warnings | ⚠️ 1 minor: `Extra attributes from the server: data-cursor-ref` (Cursor browser dev tool, not app code) |
| Runtime errors | ✅ None |
| dangerouslySetInnerHTML | ✅ Not used for DB content |
| Typed components | ✅ Uses pageViewModel only |

---

## 3. PAGE STRUCTURE VALIDATION (Symptom)

| Section | Required | Present |
|---------|----------|---------|
| Hero / Fast Answer | ✅ | ✅ |
| 30-Second Summary | ✅ | ✅ |
| Narrow Down the Problem | ✅ | ✅ |
| Diagnostic Flow | ✅ | ✅ (steps or Mermaid) |
| Causes at a Glance | ✅ | ✅ |
| Top Causes (Ranked Cards) | ✅ | ✅ |
| Cause Confirmation Flow | ✅ | ✅ |
| Repair Options | ✅ | ✅ |
| Typical Repair Costs | ✅ | ✅ |
| Technician Insights | ✅ | ✅ |
| What Happens If You Ignore | ✅ | ✅ |
| Common DIY Mistakes | ✅ | ✅ |
| Environmental Factors | ✅ | ✅ |
| Prevention Tips | ✅ | ✅ |
| When to Call Pro | ✅ | ✅ |
| CTA | ✅ | ✅ (Find Local HVAC Repair Help) |
| FAQ | ✅ | ✅ (6 questions) |
| "Common Causes & Possible Fixes" (forbidden) | ❌ | ✅ Not present |

---

## 4. LINKING ENGINE VALIDATION

| Link Type | Present | Count |
|-----------|---------|-------|
| Causes | ✅ | Multiple (Replace Capacitor, System Reset, etc.) |
| Repairs | ✅ | 20+ repair links |
| Related symptoms | ✅ | Condition links (AC Running but Not Cooling, etc.) |
| Internal links per section | ✅ | Within 5–7 range |

---

## 5. TRANSLATOR LAYER

- Raw DB JSON → `normalizePageData()` → view model → React
- No `.replace` errors observed
- No undefined/null crashes
- Consistent shapes (causes, repairs as objects)

---

## 6. MERMAID VALIDATION

- `diagnosticFlowMermaid` / `causeConfirmationMermaid` supported in view model
- Rendered via `MermaidDiagram` (client-only, ssr: false)
- Current page uses checklist/step fallbacks (no Mermaid in DB for this page)
- When Mermaid present: stored as string, passed to component only ✅

---

## 7. FIXES REQUIRED

| Issue | File | Change |
|-------|------|--------|
| Minor: `data-cursor-ref` hydration warning | N/A | Cursor browser tool adds this; not in app code. Safe to ignore. |

---

## 8. SYSTEM READINESS

**Verdict: READY FOR SCALE** (for symptom pages)

- Page renders correctly
- All required sections present
- No critical hydration or runtime errors
- Translator layer functioning
- Internal links from DB relationships

---

## Next Steps (Full Canary)

To complete the full 10-page canary:

1. **Cause pages** — Validate `/cause/[slug]` (e.g. low-refrigerant, bad-capacitor)
2. **Repair pages** — Validate `/fix/[slug]` (e.g. replace-capacitor)
3. **Condition pages** — Validate `/conditions/[slug]` (e.g. ac-running-but-not-cooling)
4. **Batch generate** — Run 10-page generation batch after cause schema fix (CAUSE_SCHEMA `additionalProperties` already fixed in prior session)
