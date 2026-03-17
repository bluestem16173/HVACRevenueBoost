/**
 * Resolve Page Sections — View Model → Render-Ready Section Map
 * ------------------------------------------------------------
 * Page-type-aware section generation. Translates PageViewModel into
 * section key → data shape expected by SECTION_MAP components.
 * Safe: missing sections return null (hide section, don't crash).
 *
 * @see docs/MASTER-PROMPT-DECISIONGRID.md
 */

import type { BasePageViewModel, PageType } from "./pageViewModels";
import { resolveLayout } from "@/lib/layout-resolver";

export type SectionKey = string;

/** Section key + data for rendering */
export interface ResolvedSection {
  key: SectionKey;
  data: unknown;
}

/** Layout keys by page type when no explicit layout in content */
const PAGE_TYPE_LAYOUTS: Record<PageType, string> = {
  symptom: "diagnostic_first",
  cause: "diagnostic_first",
  repair: "repair_first",
  condition: "scenario_first",
  component: "diagnostic_first",
  system: "diagnostic_first",
};

/**
 * Build section data from view model for a given section key.
 * Returns null if section should not render. Safe for malformed data.
 */
function resolveSectionData(
  vm: BasePageViewModel,
  sectionKey: string,
  symptomName?: string
): unknown {
  try {
    switch (sectionKey) {
      case "hero":
        return { title: vm.title, symptomName: symptomName ?? vm.title, description: vm.intro ?? vm.summary30 };
      case "technician_summary":
        return vm.technicianStatement ? { summary: vm.technicianStatement } : null;
      case "fast_answer":
        return vm.fastAnswer ? { summary: vm.fastAnswer, likely_cause: vm.fastAnswer } : null;
      case "most_common_fix":
        return vm.mostCommonFixCard ?? vm.mostCommonFix ? { fix: vm.mostCommonFixCard ?? vm.mostCommonFix } : null;
      case "diagnostic_flow":
        return vm.diagnosticFlow?.steps?.length
          ? { steps: vm.diagnosticFlow.steps, hasDiagram: false }
          : null;
      case "guided_filters":
        return vm.guidedFilters?.categories?.length ? { filters: vm.guidedFilters } : vm.filters?.length ? { filters: vm.filters } : null;
      case "causes":
        return vm.rankedCauses?.length ? { items: vm.rankedCauses } : null;
      case "repairs":
        return vm.repairOptions?.length ? { items: vm.repairOptions } : null;
      case "tools":
        return vm.toolsRequired?.length ? { items: vm.toolsRequired } : null;
      case "parts":
        return vm.partsNeeded?.length ? { items: vm.partsNeeded } : null;
      case "repair_steps":
        return vm.repairStepsOverview?.length ? { steps: vm.repairStepsOverview } : null;
      case "faq":
        return vm.faq?.length ? { items: vm.faq } : null;
      case "internal_links":
        return vm.relatedLinks?.length ? { links: vm.relatedLinks } : null;
      case "warnings":
        return vm.warnings?.length ? { items: vm.warnings } : null;
      default:
        return vm.sections?.[sectionKey] ?? null;
    }
  } catch {
    return null;
  }
}

/**
 * Resolve all sections for a layout.
 * Page-type-aware: uses PAGE_TYPE_LAYOUTS when layoutKey not provided.
 * Returns array of { key, data } for sections that have data.
 */
export function resolvePageSections(
  vm: BasePageViewModel,
  layoutKey?: string,
  symptomName?: string
): ResolvedSection[] {
  const key = layoutKey ?? vm.layout ?? PAGE_TYPE_LAYOUTS[vm.pageType] ?? "diagnostic_first";
  const layout = resolveLayout(key);
  const out: ResolvedSection[] = [];
  for (const sectionKey of layout) {
    const data = resolveSectionData(vm, sectionKey, symptomName);
    if (data !== null && data !== undefined) {
      out.push({ key: sectionKey, data });
    }
  }
  return out;
}

/** Detect page type from raw content for compatibility */
export function detectPageType(raw: Record<string, unknown> | null | undefined): PageType {
  const pt = raw?.pageType ?? raw?.page_type;
  if (typeof pt === "string") {
    const s = (pt as string).toLowerCase();
    if (["symptom", "cause", "repair", "condition", "component", "system"].includes(s)) return s as PageType;
  }
  return "symptom";
}
