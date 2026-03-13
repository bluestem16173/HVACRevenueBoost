import { SYMPTOMS, CAUSES, REPAIRS, Symptom } from "../data/knowledge-graph";

/**
 * Topical Authority Linking Logic
 */
export function getRelatedContent(currentSymptom: Symptom) {
  // Related Symptoms: Those that share at least one cause
  const relatedSymptoms = SYMPTOMS.filter(s => 
    s.id !== currentSymptom.id && 
    s.causes.some(cId => currentSymptom.causes.includes(cId))
  ).slice(0, 5);

  // Related Repairs: All repairs associated with the causes of this symptom
  const relatedRepairIds = new Set(
    currentSymptom.causes.flatMap(cId => CAUSES[cId]?.repairs || [])
  );
  const relatedRepairs = Array.from(relatedRepairIds).map(rId => REPAIRS[rId]).filter(Boolean).slice(0, 5);

  // Related Components: Unique components from the causes
  const relatedComponents = Array.from(new Set(
    currentSymptom.causes.map(cId => CAUSES[cId]?.component).filter(Boolean)
  )).slice(0, 5);

  return {
    relatedSymptoms,
    relatedRepairs,
    relatedComponents,
  };
}
