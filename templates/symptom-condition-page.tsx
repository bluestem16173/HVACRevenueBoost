/**
 * Symptom-Condition Page Template
 * Reuses 80–90% of SymptomPageTemplate. Highest traffic + highest conversion.
 * Example: AC Not Cooling (Outdoor Unit Running)
 */
import React from "react";
import SymptomPageTemplate from "./symptom-page";

export default function SymptomConditionPageTemplate(props: any) {
  const { symptom, condition, contentJson } = props;

  const modifiedSymptom = symptom
    ? { ...symptom, name: `${symptom.name} (${condition?.name || "Condition"})` }
    : { id: "unknown", name: "Symptom (Condition)", description: "" };

  return (
    <SymptomPageTemplate
      {...props}
      symptom={modifiedSymptom}
      contentJson={contentJson ?? props.contentJson}
    />
  );
}
