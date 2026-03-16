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
    
    if (!(symptom as any[])[0]) return null;

    const causes = await sql`
      SELECT c.* 
      FROM causes c
      JOIN symptom_causes sc ON sc.cause_id = c.id
      WHERE sc.symptom_id = ${(symptom as any[])[0].id}
      ORDER BY sc.created_at DESC
    `;

    // Fetch repairs via cause_repairs (DecisionGrid) or legacy cause_id
    const causeIds = (causes as any[]).map((c: any) => c.id);
    let repairs: any[] = [];
    try {
      repairs = await sql`
        SELECT r.*, cr.cause_id 
        FROM repairs r 
        JOIN cause_repairs cr ON cr.repair_id = r.id
        WHERE cr.cause_id = ANY(${causeIds})
      `;
    } catch {
      try {
        repairs = await sql`
          SELECT r.*, r.cause_id FROM repairs r WHERE r.cause_id = ANY(${causeIds})
        `;
      } catch {}
    }

    const repairsByCause = (repairs as any[]).reduce((acc: Record<string, any[]>, r: any) => {
      const cid = r.cause_id;
      if (!acc[cid]) acc[cid] = [];
      acc[cid].push({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description || r.repair_type || r.name,
        estimatedCost: r.estimated_cost || (r.skill_level === 'advanced' ? 'high' : r.skill_level === 'moderate' ? 'medium' : 'low'),
        skill_level: r.skill_level || 'moderate'
      });
      return acc;
    }, {});

    const causesWithRepairs = (causes as any[]).map((c: any) => ({
      ...c,
      id: c.slug || c.id,
      explanation: c.explanation || c.description || '',
      repairDetails: repairsByCause[c.id] || []
    }));

    return {
      ...(symptom as any[])[0],
      id: (symptom as any[])[0].slug || (symptom as any[])[0].id,
      causes: causesWithRepairs
    } as any;
  } catch (error) {
    console.error('Neon Symptom Fetch Error:', error);
    return null;
  }
}
export async function getComponentData(componentSlug: string) {
  try {
    const symptoms = SYMPTOMS.filter(s => 
      s.causes?.some((cId: string) => {
        const cause = getCauseDetails(cId);
        return cause?.component?.toLowerCase() === componentSlug.toLowerCase();
      })
    );

    const repairs = SYMPTOMS.flatMap(s => s.causes || [])
      .map(cId => getCauseDetails(cId))
      .filter(c => c?.component?.toLowerCase() === componentSlug.toLowerCase())
      .flatMap(c => c?.repairDetails || [])
      .slice(0, 10);

    return {
      component: componentSlug,
      symptoms,
      repairs: Array.from(new Set(repairs.map(r => JSON.stringify(r)))).map(s => JSON.parse(s))
    };
  } catch (error) {
    console.error('Component Data Fetch Error:', error);
    return null;
  }
}
