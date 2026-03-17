/**
 * Symptom-Condition Page Template
 * Reuses 80–90% of SymptomPageTemplate. Highest traffic + highest conversion.
 * Example: AC Not Cooling (Outdoor Unit Running)
 * Uses pageViewModel (never raw contentJson).
 */
import React from "react";
import SymptomPageTemplate from "./symptom-page";
import { normalizePageData, type BasePageViewModel } from "@/lib/content";

export default function SymptomConditionPageTemplate(props: {
  symptom?: { id: string; name: string; description?: string };
  condition?: { name: string };
  pageViewModel?: BasePageViewModel;
  contentJson?: Record<string, unknown>;
  causeDetails?: unknown[];
  [k: string]: unknown;
}) {
  const { symptom, condition, pageViewModel: vmProp, contentJson, causeDetails } = props;

  const modifiedSymptom = symptom
    ? { ...symptom, name: `${symptom.name} (${condition?.name || "Condition"})` }
    : { id: "unknown", name: "Symptom (Condition)", description: "" };

  const pageViewModel: BasePageViewModel = vmProp ?? normalizePageData({
    rawContent: contentJson ?? null,
    pageType: "symptom",
    slug: modifiedSymptom.id,
    title: modifiedSymptom.name,
    graphCauses: causeDetails as unknown[],
  });

  return (
    <SymptomPageTemplate
      {...props}
      symptom={modifiedSymptom}
      pageViewModel={pageViewModel}
    />
  );
}
