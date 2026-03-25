/**
 * Diagnostic Guide Page Template
 * Same design system as symptom page. Diagnostic decision flow.
 */
import React from "react";
import SymptomPageTemplate from "./SymptomPageTemplate.LEGACY";

export default function DiagnosticGuidePageTemplate(props: any) {
  const { symptom, contentJson } = props;

  const modifiedSymptom = symptom ?? {
    id: props.slug || "diagnostic",
    name: props.title || "HVAC Diagnostic Guide",
    description: contentJson?.fast_answer || "",
  };

  return (
    <SymptomPageTemplate
      {...props}
      symptom={modifiedSymptom}
      contentJson={contentJson ?? props.contentJson}
    />
  );
}
