# Page Type Mapping & Template Switch

**Design rule:** 80% shared design language, 20% structural variation.

- **Same:** visual system, CTA treatment, card style, FAQ styling
- **Different:** section order, headings, required JSON, content emphasis

---

## Page Types

```ts
type PageType =
  | "symptom"
  | "symptom_condition"
  | "cause"
  | "repair"
  | "component"
  | "system"
  | "location_hub"
  | "diagnostic";
```

---

## Template Switch

```ts
import { getPageTemplate, normalizePageType } from "@/lib/page-types";

const pageType = normalizePageType(page.page_type); // handles "diagnose" → "symptom"
const Template = getPageTemplate(pageType);

return <Template {...props} />;
```

---

## Prompt Files (Locked)

| Page Type       | File                    | Markdown Source                    |
|-----------------|-------------------------|------------------------------------|
| symptom         | `prompts/symptom.ts`     | `symptom-page-prompt.md`           |
| symptom_condition | `prompts/symptomCondition.ts` | `symptom-condition-page-prompt.md` |
| cause           | `prompts/cause.ts`       | `cause-page-prompt.md`             |
| repair          | `prompts/repair.ts`      | `repair-page-prompt.md`            |
| component       | `prompts/component.ts`   | `component-page-prompt.md`         |
| system          | `prompts/system.ts`     | `system-page-prompt.md`            |
| location_hub    | `prompts/locationHub.ts` | `location-hub-page-prompt.md`      |
| diagnostic      | `prompts/diagnostic.ts`  | `diagnostic-guide-page-prompt.md`  |

```ts
import { getPromptByPageType } from "@/prompts";

const promptText = getPromptByPageType(pageType);
```

---

## Schema Validators (Zod)

```ts
import { validatePageContent, getSchemaForPageType } from "@/lib/schemas";

const result = validatePageContent(pageType, contentJson);
if (result.success) {
  // result.data is validated
} else {
  // result.errors is ZodError
}
```

---

## Templates (all in `templates/`)

| Page Type       | Template                     | Notes                                              |
|-----------------|------------------------------|----------------------------------------------------|
| symptom         | `symptom-page.tsx`           | LOCKED canonical structure                          |
| symptom_condition | `symptom-condition-page.tsx` | Wraps SymptomPageTemplate, merged title             |
| cause           | `cause-page.tsx`            | contentJson-driven when present, else DB-driven     |
| repair          | `repair-page.tsx`           | contentJson-driven sections + existing structure    |
| component       | `component-page.tsx`        | contentJson-driven sections + existing structure    |
| system          | `system-page.tsx`           | Authority pillar, Mermaid diagram                   |
| location_hub    | `location-hub-page.tsx`     | Lead gen, local service hub                         |
| diagnostic      | `diagnostic-guide-page.tsx`  | Wraps SymptomPageTemplate                           |
