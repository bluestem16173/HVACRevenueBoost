/**
 * Page type enum and template switch.
 * 80% shared design language, 20% structural variation.
 * Same: visual system, CTA treatment, card style, FAQ styling.
 * Different: section order, headings, required JSON, content emphasis.
 */

import SymptomPageTemplate from "@/templates/SymptomPageTemplate.LEGACY";
import SymptomConditionPageTemplate from "@/templates/symptom-condition-page";
import CausePageTemplate from "@/templates/cause-page";
import RepairPageTemplate from "@/templates/repair-page";
import ComponentPageTemplate from "@/templates/component-page";
import SystemPageTemplate from "@/templates/system-page";
import LocationHubPageTemplate from "@/templates/location-hub-page";
import DiagnosticGuidePageTemplate from "@/templates/diagnostic-guide-page";

export type PageType =
  | "symptom"
  | "symptom_condition"
  | "cause"
  | "repair"
  | "component"
  | "system"
  | "location_hub"
  | "diagnostic";

/** Resolve page_type string to PageType (handles legacy values like "diagnose") */
export function normalizePageType(raw: string): PageType {
  const map: Record<string, PageType> = {
    symptom: "symptom",
    diagnose: "symptom",
    symptom_condition: "symptom_condition",
    condition: "symptom_condition",
    cause: "cause",
    repair: "repair",
    fix: "repair",
    component: "component",
    system: "system",
    location_hub: "location_hub",
    city: "location_hub",
    diagnostic: "diagnostic",
  };
  return (map[raw] ?? "symptom") as PageType;
}

export interface PageTemplateProps {
  page_type: PageType;
  [key: string]: unknown;
}

/**
 * Returns the React template component for a given page type.
 * Use when rendering a page from content_json / page_targets.
 */
export function getPageTemplate(pageType: PageType) {
  switch (pageType) {
    case "symptom":
      return SymptomPageTemplate;
    case "symptom_condition":
      return SymptomConditionPageTemplate;
    case "cause":
      return CausePageTemplate;
    case "repair":
      return RepairPageTemplate;
    case "component":
      return ComponentPageTemplate;
    case "system":
      return SystemPageTemplate;
    case "location_hub":
      return LocationHubPageTemplate;
    case "diagnostic":
      return DiagnosticGuidePageTemplate;
    default:
      return SymptomPageTemplate;
  }
}

