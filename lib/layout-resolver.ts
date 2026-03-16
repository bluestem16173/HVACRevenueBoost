/**
 * Layout Resolver — Resolves section order from layout key
 * -------------------------------------------------------
 * @see docs/MASTER-PROMPT-CANARY.md
 */

import { SYMPTOM_LAYOUTS } from "@/templates/layouts/symptom-layouts";

export function resolveLayout(layout: string): string[] {
  return SYMPTOM_LAYOUTS[layout] || SYMPTOM_LAYOUTS["diagnostic_first"];
}
