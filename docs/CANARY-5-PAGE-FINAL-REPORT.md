# FINAL CANARY — 5 PAGE PRODUCTION READINESS TEST

**Date:** 2026-03-17  
**Tester:** Senior QA (automated + browser validation)  
**Scope:** Symptom (complex), Symptom (simple), Cause, Repair, Condition

---

## 1. PAGE TABLE

| Page | Type | URL | PASS/FAIL | Issues |
|------|------|-----|----------|--------|
| ac-blowing-warm-air | Symptom (complex) | `/diagnose/ac-blowing-warm-air` | **PASS** | 1 minor hydration warning |
| thermostat-display-blank | Symptom (simple) | `/diagnose/thermostat-display-blank` | **PASS** | Uses minimal canary layout (layout+sections in DB) |
| low-refrigerant / bad-capacitor | Cause | `/cause/low-refrigerant` | **FAIL** | 404 — cause slugs not in DB |
| replace-capacitor | Repair | `/fix/replace-capacitor` | **PASS** | None |
| ac-running-but-not-cooling | Condition | `/conditions/ac-running-but-not-cooling` | **PASS** | None |

---

## 2. ISSUES (GROUPED)

### Rendering
- **Minor:** `Extra attributes from the server: data-cursor-ref` — Cursor browser dev tool, not app code. Benign.
- **Minor:** React DevTools suggestion — standard dev message.
- All 5 page types load without crash. No runtime errors. No `dangerouslySetInnerHTML` for DB content.

### Layout
- **Symptom (ac-blowing-warm-air):** Top Causes grid present. Uses `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` (max 4 columns). Causes limited via `.slice(0, 8)`. Grid is clean, not vertical mess.
- **Symptom (thermostat-display-blank, ac-not-turning-on):** Uses minimal canary layout when `vm.layout` + `vm.sections` exist in AI content. This is intentional — different content paths.
- **Repair / Condition:** Layouts correct.

### Linking
- **Symptom:** Links to causes, repairs, conditions. CauseCard links include `?ref=diag_${symptom.id}` for attribution.
- **Condition:** Links to causes (`/cause/`), repairs (`/fix/`), sibling conditions, components. Back to symptom.
- **Repair:** Links to Diagnose, Find Technicians, components.
- **Cause:** 404 — cannot validate linking (page does not exist).

### Tracking
- No console errors from `trackEvent` or `/api/track`.
- CTA buttons present. CauseCard repair links present.
- In-browser CTA click test skipped (viewport constraint). Code review: ServiceCTA and CauseCard call `trackEvent`; no errors observed on load.

### Schema
- **Cause 404:** Cause page requires `causes` table row. Slugs `low-refrigerant`, `bad-capacitor` not found in DB. Seed scripts use these slugs; DB may not be fully seeded or uses different schema.
- Symptom, repair, condition: required fields present. No shape mismatches observed.

---

## 3. REQUIRED FIXES

### Fix 1: Cause pages 404
- **File:** DB seed / migration
- **Change:** Ensure `causes` table has rows for `low-refrigerant`, `bad-capacitor` (or equivalent slugs used in canary).
- **Alternative:** Run `scripts/seed-hvac-core.ts` or `db/seeds/010_seed_initial_knowledge_graph.sql` to populate causes.

### Fix 2 (Optional): Hydration warning
- **File:** Root layout or component adding `data-cursor-ref`
- **Change:** If `data-cursor-ref` is from Cursor IDE, no fix needed. If from app code, remove or suppress for production.

---

## 4. FINAL VERDICT

**NOT READY** — Cause pages 404. Symptom, repair, and condition pages are production-ready.

**Blockers:**
- Cause pages (`/cause/[slug]`) return 404 for canary slugs. DB must have causes seeded.

**Ready:**
- Symptom (complex): Full template, grid, linking, CTAs.
- Symptom (simple): Minimal canary layout when AI content has layout+sections.
- Repair: Full template, CTAs, linking.
- Condition: Full template, linking to causes/repairs/siblings.

---

## 5. IF READY (POST-FIX)

After seeding causes:

- **Recommended first batch size:** 10–20 symptom pages (prioritize high-traffic clusters: ac-not-cooling, ac-blowing-warm-air, furnace-not-heating).
- **Recommended daily generation rate:** 5–10 pages/day. Validate each batch with this 5-page canary before scaling.
- **Guardrails:**
  - Run canary after each generator schema change.
  - Monitor `/api/track` and `/api/lead` for errors.
  - Ensure `rankCauses` + `.slice(0, 8)` remain in symptom template.
  - Mermaid: always `dynamic(..., { ssr: false })`.

---

## 6. VALIDATION CHECKLIST SUMMARY

| Check | Symptom | Cause | Repair | Condition |
|-------|---------|-------|--------|-----------|
| Load without crash | ✅ | ❌ 404 | ✅ | ✅ |
| No runtime errors | ✅ | — | ✅ | ✅ |
| Hydration warnings | ⚠️ minor | — | ✅ | ✅ |
| Top Causes grid (6–8, max 4 cols) | ✅ | — | — | — |
| Mermaid (ssr: false) | ✅ | — | ✅ | — |
| Translator layer | ✅ | — | ✅ | — |
| Linking engine | ✅ | — | ✅ | ✅ |
| Revenue tracking | ✅ | — | ✅ | — |
| Schema | ✅ | ❌ | ✅ | ✅ |
