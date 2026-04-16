/**
 * Prompt registry — get prompt text by page type.
 * Hierarchical: Master System Prompt + Page-Type Prompt + Context → JSON Output
 * Locked files: master, symptom, symptomCondition, cause, repair, component, system, locationHub, diagnostic.
 */

import type { PageType } from "@/lib/page-types";
import { getMasterSystemPrompt } from "./master";
import { getMasterAuthorityConversionPrompt } from "./masterAuthorityConversion";
import { getSymptomPrompt } from "./symptom";
import { getSymptomConditionPrompt } from "./symptomCondition";
import { getCausePrompt } from "./cause";
import { getRepairPrompt } from "./repair";
import { getComponentPrompt } from "./component";
import { getSystemPrompt } from "./system";
import { getLocationHubPrompt } from "./locationHub";
import { getDiagnosticPrompt } from "./diagnostic";

export function getPromptByPageType(pageType: PageType): string {
  switch (pageType) {
    case "symptom":
      return getSymptomPrompt();
    case "symptom_condition":
      return getSymptomConditionPrompt();
    case "cause":
      return getCausePrompt();
    case "repair":
      return getRepairPrompt();
    case "component":
      return getComponentPrompt();
    case "system":
      return getSystemPrompt();
    case "location_hub":
      return getLocationHubPrompt();
    case "diagnostic":
      return getDiagnosticPrompt();
    default:
      return getSymptomPrompt();
  }
}

/** Compose Master + Page-Type prompt for hierarchical generation */
export function composePromptForPageType(pageType: PageType): string {
  const master = getMasterSystemPrompt();
  const pagePrompt = getPromptByPageType(pageType);
  return `${master}\n\n---\n\n${pagePrompt}`;
}

/** Master Authority + Conversion (homeowner) + same page-type body — for JSON/HTML pipelines that want this voice. */
export function composeAuthorityConversionPrompt(pageType: PageType): string {
  const master = getMasterAuthorityConversionPrompt();
  const pagePrompt = getPromptByPageType(pageType);
  return `${master}\n\n---\n\n${pagePrompt}`;
}

export {
  getMasterAuthorityConversionPrompt,
  getMasterSystemPrompt,
  getSymptomPrompt,
  getSymptomConditionPrompt,
  getCausePrompt,
  getRepairPrompt,
  getComponentPrompt,
  getSystemPrompt,
  getLocationHubPrompt,
  getDiagnosticPrompt,
};
