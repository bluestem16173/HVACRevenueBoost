# 🔒 DECISIONGRID V2.1 PRODUCTION LOCK 🔒

**LOCKED DATE:** MARCH 31, 2026
**STATUS:** PRODUCTION / MASTER
**PROTECTION LEVEL:** MAXIMUM

This file serves as a manifest marking the guaranteed, functioning version of the DecisionGrid V2 pipeline. **DO NOT OVERWRITE OR DELETE THESE FILES WITHOUT A BACKUP.**

---

### Core Files Locked in this State:

The AI generation pipeline relies heavily on the physical separation of structural commands vs qualitative inputs. Modifying these without extreme caution will cause Schema Drift.

**1. Semantic System Core & Flow Rules**
- `docs/DECISIONGRID-MASTER-PROMPT-V1.md` 
  *(Controls dense phrasing, bulleted structures, eliminates "blog" terminology)*
- `docs/DECISIONGRID-MASTER-DIAGNOSTIC-AUTHORITY-PAGE-PROMPT.md` 
  *(The raw dg_html_v1 15-Point SEO Authority Checklist)*

**2. V2 Standard Pipeline Prompts**
- `prompts/decisiongrid-master-v2-system.md`
  *(Contains the rigid output structure requirement locking JSON keys via explicit Zod translation)*
- `prompts/decisiongrid-master-v2-user.md`
  *(Holds dynamic PAGE_EMPHASIS_BLOCK injection dictating semantic focus but explicitly rejecting layout overrides)*

**3. TypeScript Structural Guardrails**
- `content-engine/src/lib/validation/diagnosticSchema.ts`
  *(The exact Zod literal representation of the JSON that the AI prompt mimics)*
- `content-engine/src/lib/validation/validateDiagnostic.ts`
  *(Rejects payload strings with raw HTML formatting or missing keys before DB storage)*
- `content-engine/src/lib/ai/systemPreambleBuilders.ts`
  *(The concatenation logic fusing Tone/Rule requirements with JSON constraints)*
- `content-engine/src/lib/ai/generateDiagnosticEngineJson.ts`
  *(Orchestration script that manages the layout vs. emphasis prompt handoff seamlessly)*
  
---

### If You Need to Restore Everything:
A git commit & tag (`v2.1-decisiongrid-lock`) has been secured in the background. If anything ever breaks down the line, these core pieces are permanently snapshot in your repository history.
