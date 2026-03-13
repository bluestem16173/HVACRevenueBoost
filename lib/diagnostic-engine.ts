import { SYMPTOMS, CAUSES, REPAIRS } from "@/data/knowledge-graph";
import sql from "./db";

/**
 * GENERATION GUARDRAILS
 * Minimum threshold for a symptom-city combo to be considered "high quality"
 */
const MIN_CAUSES_FOR_PAGE = 2;
const MIN_REPAIRS_FOR_PAGE = 2;

export interface DiagnosticStep {
  step: string;
  action: string;
}

export interface SymptomData {
  id: string;
  name: string;
  slug: string;
  description: string;
  causes: any[];
}

/**
 * Diagnostic logic for the "Residential HVAC Manual" look.
 * Translates component-based causes into human-readable manual steps.
 */
export function getDiagnosticSteps(causeIds: string[]): DiagnosticStep[] {
  // Map specific components to universal manual steps
  const steps: DiagnosticStep[] = [
    {
      step: "Safety First: Power Down",
      action: "Locate the SERVICE DISCONNECT at the outdoor unit or the HVAC breaker in your main electrical panel. Turn it OFF."
    },
    {
      step: "Check the Air Filter",
      action: "Remove your indoor air filter. If you cannot see light through it, replace it immediately. A clogged filter is the #1 cause of airflow issues."
    }
  ];

  // Add more steps based on the causes provided
  if (causeIds.includes("refrigerant-leak") || causeIds.includes("dirty-coils")) {
    steps.push({
      step: "Inspect the Indoor Coil",
      action: "Look for ice buildup on the copper lines. If found, let the system thaw for 4 hours before calling a technician."
    });
  }

  if (causeIds.includes("failed-capacitor") || causeIds.includes("welded-contactor")) {
    steps.push({
      step: "Listen for Fan Sounds",
      action: "If you hear a humming sound but the outdoor fan isn't spinning, DO NOT keep the power on. This indicates a motor or capacitor failure."
    });
  }

  steps.push({
    step: "Final Validation",
    action: "Restore power and set the thermostat to 5 degrees below current room temperature. Wait 15 minutes for the compressor 'time-delay' to end."
  });

  return steps;
}

/**
 * Content guardrail: prevents generating "thin" pages
 */
export function shouldGeneratePage(symptomId: string): boolean {
  const symptom = SYMPTOMS.find(s => s.id === symptomId);
  if (!symptom) return false;
  
  return symptom.causes.length >= MIN_CAUSES_FOR_PAGE;
}

/**
 * DISCOVERY PIPELINE
 * Implementation of the "Deterministic Knowledge Graph" candidate search.
 */
export function getValidCandidates() {
  return SYMPTOMS.filter(s => shouldGeneratePage(s.id));
}

export function getCauseDetails(causeId: string) {
  const cause = CAUSES[causeId];
  if (!cause) return null;

  return {
    ...cause,
    repairDetails: cause.repairs.map(rId => REPAIRS[rId]).filter(Boolean)
  };
}

/**
 * NEON ASYNC HELPERS (DecisionGrid Overhaul)
 */

export async function getDiagnosticPageFromDB(slug: string): Promise<any | null> {
  try {
    const results = await sql`
      SELECT 
        p.*,
        s.name as system_name,
        sym.name as symptom_name
      FROM pages p
      LEFT JOIN systems s ON p.system_id = s.id
      LEFT JOIN symptoms sym ON p.symptom_id = sym.id
      WHERE p.slug = ${slug}
      LIMIT 1
    `;
    return results[0] || null;
  } catch (error) {
    console.error('Neon Query Error:', error);
    return null;
  }
}

export async function getSymptomWithCausesFromDB(symptomSlug: string): Promise<SymptomData | null> {
  try {
    const symptom = await sql`
      SELECT * FROM symptoms WHERE slug = ${symptomSlug} LIMIT 1
    `;
    
    if (!symptom[0]) return null;

    const causes = await sql`
      SELECT c.* 
      FROM causes c
      JOIN symptom_causes sc ON sc.cause_id = c.id
      WHERE sc.symptom_id = ${symptom[0].id}
    `;

    return {
      ...symptom[0],
      causes: causes
    } as any;
  } catch (error) {
    console.error('Neon Symptom Fetch Error:', error);
    return null;
  }
}
