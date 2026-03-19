import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import { canBuildFromGraph, buildPageFromGraph } from './deterministic-page-builder';
import { slugify, link } from './link-helpers';
import { getMasterSystemPrompt } from '@/prompts/master';
import { normalizeToString, safeJsonParse } from '@/lib/utils';
import { formatTextSafe, formatTitle, formatBullets } from '@/lib/text-format';
import { composePromptForPageType, validateCoreForPageType, type SchemaDef } from '@/lib/prompt-schema-router';
dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/** Token budgets by page type (reduces truncation) */
const TOKEN_BUDGETS: Record<string, { pass1: number; pass2: number }> = {
  symptom: { pass1: 2000, pass2: 1200 },
  condition: { pass1: 3200, pass2: 1400 },
  diagnostic: { pass1: 2600, pass2: 1200 },
  cause: { pass1: 2200, pass2: 1000 },
  repair: { pass1: 1800, pass2: 800 },
  default: { pass1: 2200, pass2: 1200 },
};

function getTokenBudget(pageType: string) {
  return TOKEN_BUDGETS[pageType] || TOKEN_BUDGETS.default;
}

/** Pass 2: Strict JSON schema for enrichment */
const PASS2_SCHEMA = {
  type: 'object' as const,
  additionalProperties: false,
  properties: {
    mermaid_graph: { type: 'string', description: 'Compact diagnostic flowchart' },
    field_note: { type: 'string', description: '2-4 sentences technician insight' },
    repair_explanations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          repair: { type: 'string' },
          why_it_fails: { type: 'string' },
          repair_tip: { type: 'string' },
        },
        required: ['repair', 'why_it_fails', 'repair_tip'],
      },
    },
    confidence_score: { type: 'number', description: '0-100' },
  },
  required: ['mermaid_graph', 'field_note', 'repair_explanations', 'confidence_score'],
};

/** Enrichment-only schema (graph-first flow) */
const ENRICHMENT_ONLY_SCHEMA = {
  type: 'object' as const,
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    field_note: { type: 'string' },
    repair_explanations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          repair: { type: 'string' },
          why_it_fails: { type: 'string' },
          repair_tip: { type: 'string' },
        },
        required: ['repair', 'why_it_fails', 'repair_tip'],
      },
    },
    mermaid_graph: { type: 'string' },
    confidence_score: { type: 'number' },
  },
  required: ['summary', 'field_note', 'repair_explanations', 'mermaid_graph', 'confidence_score'],
};

/** Compose Master + Page-Type prompt (hierarchical architecture) */
export function composeSystemPrompt(pageTypePrompt: string): string {
  const master = getMasterSystemPrompt();
  return `${master}\n\n---\n\n${pageTypePrompt}`;
}

/** Enrichment-only: when page is built from DB graph */
const ENRICHMENT_ONLY_PROMPT = `Add enrichment to a page built from the knowledge graph. The causes and repairs are ALREADY set. Do NOT regenerate them.

Rules:
- Be concise. Summary: 1 sentence.
- Field note: 2-4 sentences maximum.
- Mermaid graph must be compact.
- Confidence score should reflect how strongly the listed causes fit the symptom.`;

/** Pass 2: Content enrichment using core data */
const PASS2_PROMPT = `Using the validated core repair data provided below, generate only the remaining enrichment fields.

Rules:
- Be concise.
- Mermaid graph must be compact.
- Field note should be 2-4 sentences maximum.
- Confidence score should reflect how strongly the listed causes fit the symptom and condition.`;

// ----------------------------------------------------
// SCHEMA ENFORCER LAYER (Intercepts raw AI responses)
// ----------------------------------------------------

function fallbackSystemExplanation() {
  return [
    "The system receives a signal to activate and begins operating.",
    "Internal components process the request and perform their designated function.",
    "The system outputs the result and rejects any waste byproducts.",
    "This cycle continues continuously until the thermostat detects the setpoint."
  ];
}

function fallbackTech() {
  return "Always verify power at the disconnect before assuming a component failure to prevent misdiagnosis.";
}

function fallbackMechanical() {
  return "Check for adequate airflow and pressure drops across the coil to rule out mechanical restrictions.";
}

function getFallbackMatrix() {
  return {
    electrical: [
      { name: "Check circuit breaker", difficulty: "easy", estimated_cost_range: "$0", description: "Verify breaker is not tripped." },
      { name: "Inspect wiring", difficulty: "medium", estimated_cost_range: "$50-$150", description: "Use multimeter to check voltage." },
      { name: "Replace main board", difficulty: "hard", estimated_cost_range: "$300-$800", description: "Install new control board." }
    ],
    mechanical: [
      { name: "Clean outer casing", difficulty: "easy", estimated_cost_range: "$0", description: "Remove debris from unit." },
      { name: "Lubricate moving parts", difficulty: "medium", estimated_cost_range: "$50-$150", description: "Apply oil to motor bearings." },
      { name: "Replace motor", difficulty: "hard", estimated_cost_range: "$200-$600", description: "Install new blower motor." }
    ],
    structural: [
      { name: "Inspect physical mounts", difficulty: "easy", estimated_cost_range: "$0", description: "Check unit for level." },
      { name: "Seal minor leaks", difficulty: "medium", estimated_cost_range: "$50-$150", description: "Apply mastic to duct seams." },
      { name: "Rebuild mounting frame", difficulty: "hard", estimated_cost_range: "$200-$500", description: "Construct new support base." }
    ]
  };
}

function ensureMin(arr: any, min: number) {
  if (!arr || arr.length < min) return [];
  return arr;
}

function enforceRepairMatrix(matrix: any) {
  const systems = ["electrical", "mechanical", "structural"];
  const fallback = getFallbackMatrix();
  const result: any = {};
  for (const sys of systems) {
    if (!matrix?.[sys] || matrix[sys].length !== 3) {
      result[sys] = fallback[sys as keyof typeof fallback];
    } else {
      result[sys] = matrix[sys];
    }
  }
  return result;
}

export function enforceSymptomSchema(data: any) {
  return {
    ...data,
    title: data.title || "",

    fast_answer: data.fast_answer || {
      summary: "",
      severity: "medium",
      urgency: "medium"
    },

    system_explanation:
      Array.isArray(data.system_explanation) && data.system_explanation.length === 4
        ? data.system_explanation
        : fallbackSystemExplanation(),

    environments: ensureMin(data.environments, 3),
    conditions: ensureMin(data.conditions, 3),
    noises: ensureMin(data.noises, 2),

    tech_observation: data.tech_observation || fallbackTech(),
    mechanical_field_note: data.mechanical_field_note || fallbackMechanical(),

    repair_matrix: enforceRepairMatrix(data.repair_matrix),

    top_causes: ensureMin(data.top_causes, 3),
    diagnostic_steps: ensureMin(data.diagnostic_steps, 3),

    related_repairs: data.related_repairs || [],
    related_components: data.related_components || []
  };
}

/** Per-type core validation. Delegates to prompt-schema-router. */
export function validateCoreData(core: any, pageType = 'symptom'): { valid: boolean; errors: string[] } {
  return validateCoreForPageType(pageType, core as Record<string, unknown>);
}

export function mergeJSON(core: any, enrichment: any): any {
  const merged = { ...core };
  if (enrichment?.mermaid_graph) merged.mermaid_graph = enrichment.mermaid_graph;
  if (enrichment?.field_note) merged.field_notes = enrichment.field_note;
  if (enrichment?.field_notes) merged.field_notes = enrichment.field_notes;
  if (enrichment?.confidence_score != null) merged.confidence_score = enrichment.confidence_score;
  if (enrichment?.summary) merged.summary = enrichment.summary;
  if (enrichment?.summary) merged.fast_answer = enrichment.summary;

  if (enrichment?.repair_explanations?.length && merged.repairs?.length) {
    merged.repairs = merged.repairs.map((r: any) => {
      const rName = normalizeToString(r.name).toLowerCase();
      const exp = enrichment.repair_explanations.find((e: any) => {
        const eRepair = (e.repair || '').toLowerCase();
        return eRepair.includes(rName) || rName.includes(eRepair) || eRepair.split(/\s+/).some((w: string) => rName.includes(w));
      });
      const why = exp?.why_it_fails || r.explanation || r.fix_summary;
      const tip = exp?.repair_tip || r.repair_tip;
      return {
        ...r,
        explanation: why,
        repair_tip: tip,
        cost: r.cost || r.estimated_cost,
      };
    });
  }
  return merged;
}

async function callWithRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }
  throw lastError;
}

export type GenerateCoreDataOptions = {
  pageType: string;
  slug: string;
  title?: string;
  system?: string;
  symptom?: string;
  condition?: string;
  environment?: string;
  vehicle?: string;
  /** Use QA/validation prompt for stricter test-run output */
  validationMode?: boolean;
};

export async function generateCoreData(
  pageSlugOrOptions: string | GenerateCoreDataOptions,
  pageType?: string,
  pageTitle?: string,
  context: { system?: string; symptom?: string; condition?: string; environment?: string; vehicle?: string } = {}
): Promise<Record<string, unknown>> {
  let pageSlug: string;
  let resolvedPageType: string;
  let resolvedTitle: string;

  if (typeof pageSlugOrOptions === 'object') {
    const opts = pageSlugOrOptions;
    pageSlug = opts.slug;
    resolvedPageType = opts.pageType;
    resolvedTitle = opts.title ?? opts.slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    context = {
      system: opts.system,
      symptom: opts.symptom,
      condition: opts.condition,
      environment: opts.environment,
      vehicle: opts.vehicle,
    };
  } else {
    pageSlug = pageSlugOrOptions;
    resolvedPageType = pageType ?? 'symptom';
    resolvedTitle = pageTitle ?? pageSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  const system = context.system || 'Central Air Conditioner';
  const symptom = context.symptom || resolvedTitle;
  const condition = context.condition || '';
  const environment = context.environment || 'Residential';
  const vehicle = context.vehicle || '';
  const { pass1 } = getTokenBudget(resolvedPageType);

  const userMsg = `Context:
System: ${system}
Symptom: ${symptom}
Condition: ${condition}
Environment: ${environment}
Unit: ${vehicle}

Page: ${pageSlug} (${resolvedPageType})
Use slug: ${pageSlug} and title: ${resolvedTitle} in your JSON output.

Authoring intent: This content is for a highly technical repair knowledge graph used for SEO and lead generation. It should read like a field technician's structured diagnostic output, not a consumer blog post.`;

  const validationMode = typeof pageSlugOrOptions === 'object' ? pageSlugOrOptions.validationMode : false;
  const prompt = composePromptForPageType(resolvedPageType, pageSlug, { validationMode });
  return generateWithSchema(prompt, userMsg, {
    pageSlug,
    resolvedPageType,
    pass1,
  });
}

async function generateWithSchema(
  systemPrompt: string,
  userMsg: string,
  opts: { pageSlug: string; resolvedPageType: string; pass1: number }
): Promise<Record<string, unknown>> {
  const { pageSlug, resolvedPageType, pass1 } = opts;
  console.log('[GENERATOR] pageType:', resolvedPageType);
  console.log('[GENERATOR] slug:', pageSlug);
  console.log('[GENERATOR] model: gpt-4o');
  console.log('[GENERATOR] promptVersion: master-v2-json-object');
  console.log('[GENERATOR] validator: validate' + resolvedPageType.charAt(0).toUpperCase() + resolvedPageType.slice(1) + 'Page');

  const MAX_RETRIES = 2;
  let lastError: unknown;
  for (let retryCount = 0; retryCount <= MAX_RETRIES; retryCount++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMsg },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const contentStr = response.choices[0]?.message?.content;
      if (!contentStr) throw new Error('Pass 1: empty response');
      const parsed = safeJsonParse<Record<string, unknown>>(contentStr);
      if (!parsed) throw new Error('Pass 1: unrecoverable JSON');
      
      let finalParsed = parsed;
      if (resolvedPageType === 'symptom') {
        finalParsed = enforceSymptomSchema(parsed);
      }
      
      console.log('[GENERATOR] top-level keys:', Object.keys(finalParsed || {}));
      
      const valResult = validateCoreForPageType(resolvedPageType, finalParsed);
      if (!valResult.valid) {
        throw new Error('Validation failed: ' + valResult.errors.join(', '));
      }

      parsed.prompt_version = "master-v2-json-object";

      return parsed;
    } catch (err: any) {
      lastError = err;
      if (retryCount < MAX_RETRIES) {
        console.warn('⚠️ Retry due to invalid format:', pageSlug, err?.message || err);
        await new Promise((r) => setTimeout(r, 1000 * (retryCount + 1)));
      } else {
        console.error('❌ Failed after retries:', pageSlug, err?.message || err);
        throw lastError;
      }
    }
  }
  throw lastError;
}

/** AI enrichment only — for pages built from DB graph. */
export async function generateEnrichmentOnly(graphPageData: any, pageTitle: string) {
  const userMsg = `Core data (causes and repairs already set):
Symptom: ${pageTitle}
Causes: ${(graphPageData.causes || []).map((c: any) => c.name).join(', ')}
Repairs: ${(graphPageData.repairs || []).map((r: any) => r.name).join(', ')}

Generate: summary, field_note, repair_explanations (match repair names), mermaid_graph, confidence_score.`;

  return callWithRetry(async () => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ENRICHMENT_ONLY_PROMPT },
        { role: 'user', content: userMsg },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'enrichment_only',
          strict: true,
          schema: ENRICHMENT_ONLY_SCHEMA,
        },
      },
      temperature: 0.2,
      max_tokens: 1000,
    });

    const contentStr = response.choices[0]?.message?.content;
    if (!contentStr) throw new Error('Enrichment only: empty response');
    const parsed = safeJsonParse<Record<string, unknown>>(contentStr);
    if (!parsed) throw new Error('Enrichment only: unrecoverable JSON');
    return parsed;
  });
}

export async function generateEnrichment(coreData: any, pageTitle: string, pageType = 'symptom') {
  const { pass2 } = getTokenBudget(pageType);

  const userMsg = `Core data:
${JSON.stringify({ summary: coreData.summary, causes: coreData.causes, repairs: coreData.repairs }, null, 2)}

Page topic: ${pageTitle}

Generate: mermaid_graph, field_note, repair_explanations (match repair names), confidence_score.`;

  const systemPrompt = composeSystemPrompt(PASS2_PROMPT);

  return callWithRetry(async () => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMsg },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'enrichment',
          strict: true,
          schema: PASS2_SCHEMA,
        },
      },
      temperature: 0.2,
      max_tokens: pass2,
    });

    const contentStr = response.choices[0]?.message?.content;
    if (!contentStr) throw new Error('Pass 2: empty response');
    const parsed = safeJsonParse<Record<string, unknown>>(contentStr);
    if (!parsed) throw new Error('Pass 2: unrecoverable JSON');
    return parsed;
  });
}

/**
 * Generate page content.
 * Graph-first: if graphData provided and sufficient, use deterministic builder + AI enrichment only (~800 tokens).
 * Fallback: full two-stage generation (~2000 tokens).
 */
export async function generatePageContent(
  pageSlug: string,
  pageType: string,
  pageTitle: string,
  additionalContext: any = {}
) {
  console.log("PAGE TYPE:", pageType);
  const graphSymptom = additionalContext.graphSymptom;

  if (graphSymptom) {
    if (canBuildFromGraph(graphSymptom)) {
      console.log('📦 Graph-first: Building from DB, AI enrichment only...');
      const pageData = buildPageFromGraph(graphSymptom, {
        title: `${pageTitle} | Causes, Diagnosis, Repair Cost`,
        slug: pageSlug,
        conditions: additionalContext.conditions,
      });
      const enrichment = await generateEnrichmentOnly(pageData, pageTitle);
      const merged = mergeJSON(pageData, enrichment);
      merged.fast_answer = merged.fast_answer || enrichment.summary || merged.summary;
      merged.title = merged.title || pageData.title;
      merged.slug = merged.slug || pageSlug;
      return merged;
    }
  }

  const ctx = additionalContext.systemContext || additionalContext;
  const context = {
    system: (typeof ctx === 'object' && ctx?.system) || additionalContext.system || 'Central Air Conditioner',
    symptom: additionalContext.symptom || pageTitle,
    condition: additionalContext.condition || (typeof ctx === 'object' && ctx?.condition) || '',
    environment: additionalContext.environment || (typeof ctx === 'object' && ctx?.environment) || 'Residential',
    vehicle: additionalContext.vehicle || (typeof ctx === 'object' && ctx?.vehicle) || '',
  };

  console.log('📦 Pass 1: Generating core data...');
  const core = await generateCoreData(pageSlug, pageType, pageTitle, context);

  const { valid, errors } = validateCoreData(core, pageType);
  if (!valid) {
    console.warn('⚠️ Core validation:', errors.join(', '));
  }

  const symptomLike = ['symptom', 'symptom_condition', 'condition', 'diagnostic', 'diagnose'].includes(
    (pageType || '').toLowerCase().replace(/-/g, '_')
  );
  let merged = { ...core };
  const hasCausesAndRepairs = Array.isArray(core?.causes) && core.causes.length > 0 && Array.isArray(core?.repairs) && core.repairs.length > 0;
  if (symptomLike && hasCausesAndRepairs) {
    console.log('📦 Pass 2: Generating enrichment...');
    const enrichment = await generateEnrichment(core, pageTitle, pageType);
    merged = mergeJSON(core, enrichment);
  }

  merged.title = merged.title || `${pageTitle} | Causes, Diagnosis, Repair Cost`;
  merged.slug = merged.slug || pageSlug;
  merged.fast_answer = merged.fast_answer || merged.summary;
  merged.diagnostics = merged.diagnostics || merged.diagnostic_steps;

  return merged;
}

/** Escape HTML for safe output */
function esc(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Repair page renderer — Fix → Steps → Cost → Decision → CTA (no diagnostic overload) */
function renderRepairPage(data: any): string {
  const Hero = (d: any) => `
    <div class="space-y-4 text-center mb-10">
      <h1 class="text-3xl font-bold text-slate-900">${esc(d.title || '')}</h1>
      <p class="text-slate-600 text-lg">${esc(d.fastAnswer || d.fast_answer || '')}</p>
    </div>`;

  const MostLikelyFix = (d: any) => {
    const fix = d.mostLikelyFix || d.whatThisFixes || d.fastAnswer || d.fast_answer;
    if (!fix) return '';
    return `
    <div class="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-8">
      <strong class="text-amber-900">Most Likely Fix:</strong> <span class="text-amber-900">${esc(fix)}</span>
    </div>`;
  };

  const StepsSection = (d: any) => {
    const steps = d.stepByStep || d.stepsOverview || [];
    if (!Array.isArray(steps) || steps.length === 0) return '';
    return `
    <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
      <h2 class="text-xl font-extrabold uppercase tracking-wide text-slate-900 border-b-2 border-slate-900 pb-2 mb-4">How to Fix This</h2>
      <ol class="space-y-3 list-decimal list-inside">
        ${steps.map((step: unknown, i: number) => {
          const text = typeof step === 'string' ? step : (step as { step?: string; action?: string })?.step || (step as { step?: string; action?: string })?.action || '';
          return `
          <li class="flex gap-3">
            <span class="font-bold text-blue-600">${i + 1}.</span>
            <span class="text-slate-800">${esc(text)}</span>
          </li>
        `;
        }).join('')}
      </ol>
    </div>`;
  };

  const CostDifficulty = (d: any) => {
    const cost = d.cost || d.costEstimate;
    const costPro = cost?.professional ?? cost?.diy ?? '—';
    const diff = d.difficulty?.level ?? d.difficulty ?? '—';
    const time = d.timeRequired || (d.timeEstimate?.professional ?? '');
    return `
    <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
      <h2 class="text-xl font-extrabold uppercase tracking-wide text-slate-900 border-b-2 border-slate-900 pb-2 mb-4">Difficulty & Cost</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-slate-50 p-4 rounded-xl">
          <strong class="text-slate-700">Difficulty:</strong> <span class="text-slate-900">${esc(String(diff))}</span>
        </div>
        <div class="bg-slate-50 p-4 rounded-xl">
          <strong class="text-slate-700">Professional Cost:</strong> <span class="text-slate-900 font-semibold">${esc(String(costPro))}</span>
        </div>
        ${time ? `<div class="sm:col-span-2 bg-slate-50 p-4 rounded-xl"><strong class="text-slate-700">Time:</strong> ${esc(time)}</div>` : ''}
      </div>
    </div>`;
  };

  const ToolsParts = (d: any) => {
    const tools = d.toolsRequired || d.tools || [];
    const parts = d.partsRequired || d.parts || [];
    if ((!Array.isArray(tools) || tools.length === 0) && (!Array.isArray(parts) || parts.length === 0)) return '';
    return `
    <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
      <h2 class="text-xl font-extrabold uppercase tracking-wide text-slate-900 border-b-2 border-slate-900 pb-2 mb-4">Tools & Parts Needed</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 class="font-semibold text-slate-800 mb-2">Tools</h3>
          <ul class="list-disc pl-5 space-y-1 text-slate-700">${(tools || []).map((t: any) => `<li>${esc(typeof t === 'string' ? t : t?.name || '')}</li>`).join('')}</ul>
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 mb-2">Parts</h3>
          <ul class="list-disc pl-5 space-y-1 text-slate-700">${(parts || []).map((p: any) => `<li>${esc(typeof p === 'string' ? p : p?.name || '')}</li>`).join('')}</ul>
        </div>
      </div>
    </div>`;
  };

  const SafetySection = (d: any) => {
    const warnings = d.safetyWarnings || d.whenNotToDIY || [];
    if (!Array.isArray(warnings) || warnings.length === 0) return '';
    return `
    <div class="bg-red-50 border border-red-200 p-4 rounded-xl mb-8">
      <h3 class="font-semibold text-red-900 mb-2">Safety Warnings</h3>
      <ul class="list-disc pl-5 text-red-800 space-y-1">${warnings.map((s: string) => `<li>${esc(s)}</li>`).join('')}</ul>
    </div>`;
  };

  const PILLAR_ORDER = ['ducting_airflow', 'electrical', 'refrigeration', 'mechanical'];
  const PILLAR_LABELS: Record<string, string> = {
    ducting_airflow: 'Structural (Ducting)',
    electrical: 'Electrical',
    refrigeration: 'Chemical (Refrigeration)',
    mechanical: 'Mechanical',
  };
  const diffColor = (c: string) => {
    const x = (c || '').toLowerCase();
    if (x.includes('advanced') || x.includes('pro') || x.includes('red')) return 'bg-red-100 text-red-800 border-red-200';
    if (x.includes('moderate') || x.includes('yellow')) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  };

  const RepairOptionsByPillar = (d: any) => {
    const matrix = d.repairDifficultyMatrix;
    if (typeof matrix !== 'object' || matrix === null) {
      const repairs = d.repairOptions || d.repairs || [];
      const items = Array.isArray(repairs) ? repairs.slice(0, 5) : [];
      if (items.length === 0) return '';
      const names = items.map((r: any) => typeof r === 'string' ? r : r?.name ?? '').filter(Boolean);
      return `
    <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
      <h2 class="text-xl font-extrabold uppercase tracking-wide text-slate-900 border-b-2 border-slate-900 pb-2 mb-4">Top Repair Options</h2>
      <ul class="list-disc pl-5 space-y-2 text-slate-700">${names.map((n) => `<li>${link(`fix/${slugify(n)}`, n)}</li>`).join('')}</ul>
    </div>`;
    }
    let html = `
    <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
      <h2 class="text-xl font-extrabold uppercase tracking-wide text-slate-900 border-b-2 border-slate-900 pb-2 mb-4">Repair Options by System</h2>
      <p class="text-sm text-slate-600 mb-6">🟢 DIY Safe | 🟡 Moderate Skill | 🔴 Professional Required</p>
      <div class="space-y-6">`;
    for (const slug of PILLAR_ORDER) {
      const items = matrix[slug] || [];
      if (items.length === 0) continue;
      html += `
        <div class="rounded-xl border border-slate-200 overflow-hidden">
          <h3 class="text-lg font-bold text-slate-900 bg-slate-50 px-4 py-3 border-b border-slate-200">${esc(PILLAR_LABELS[slug] ?? slug)}</h3>
          <ul class="p-4 space-y-3">`;
      for (const item of items.slice(0, 6)) {
        const name = item.name || '';
        const cost = item.cost_range || item.cost || '—';
        const diff = item.difficulty || '—';
        html += `
            <li class="flex flex-wrap items-center gap-2">
              <span class="font-medium text-slate-800">${link(`fix/${slugify(name)}`, name)}</span>
              <span class="text-sm font-semibold text-slate-600">${esc(cost)}</span>
              <span class="inline-block border px-2 py-0.5 rounded text-xs font-bold ${diffColor(diff)}">${esc(diff)}</span>
            </li>`;
      }
      html += `</ul></div>`;
    }
    html += `</div></div>`;
    return html;
  };

  const RootCausesByPillar = (d: any) => {
    const causes = d.rootCausesByPillar;
    if (typeof causes !== 'object' || causes === null) {
      const flat = d.relatedCauses || d.relatedSymptoms || [];
      if (!Array.isArray(flat) || flat.length === 0) return '';
      return `
    <div class="bg-slate-50 p-4 rounded-xl mb-8">
      <h3 class="font-semibold text-slate-800 mb-2">Possible Causes</h3>
      <ul class="list-disc pl-5 text-slate-700 space-y-1">${flat.map((c: string) => `<li>${esc(c)}</li>`).join('')}</ul>
    </div>`;
    }
    let html = `
    <div class="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
      <h2 class="text-xl font-extrabold uppercase tracking-wide text-slate-900 border-b-2 border-slate-900 pb-2 mb-4">Technical Root Causes by System</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">`;
    for (const slug of PILLAR_ORDER) {
      const items = causes[slug] || [];
      if (items.length === 0) continue;
      html += `
        <div class="rounded-xl border border-slate-200 p-4 bg-white">
          <h3 class="font-bold text-slate-900 mb-3 uppercase tracking-wide">${esc(PILLAR_LABELS[slug] ?? slug)}</h3>
          <ul class="space-y-2">`;
      for (const item of items.slice(0, 6)) {
        const name = typeof item === 'string' ? item : (item.name || '');
        const cost = typeof item === 'object' && item ? (item.cost || '') : '';
        const diff = typeof item === 'object' && item ? (item.difficulty || '') : '';
        html += `
            <li class="flex flex-col gap-0.5">
              <span class="font-medium text-slate-800">• ${esc(name)}</span>
              ${cost ? `<span class="text-sm text-slate-600">${esc(cost)}</span>` : ''}
              ${diff ? `<span class="inline-block w-fit border px-1.5 py-0.5 rounded text-xs font-bold ${diffColor(diff)}">${esc(diff)}</span>` : ''}
            </li>`;
      }
      html += `</ul></div>`;
    }
    html += `</div></div>`;
    return html;
  };

  const PillarBreakdown = (d: any) => {
    const pb = d.pillarBreakdown;
    if (typeof pb !== 'object' || pb === null) return '';
    let html = `
    <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
      <h2 class="text-xl font-extrabold uppercase tracking-wide text-slate-900 border-b-2 border-slate-900 pb-2 mb-4">Pillar Breakdown</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">`;
    for (const slug of PILLAR_ORDER) {
      const items = pb[slug] || [];
      if (items.length === 0) continue;
      html += `
        <div class="rounded-xl border border-slate-200 p-4">
          <h3 class="font-bold text-slate-900 mb-3 uppercase tracking-wide">${esc(PILLAR_LABELS[slug] ?? slug)}</h3>
          <ul class="space-y-2">`;
      for (const x of items.slice(0, 5)) {
        const issue = x.issue || x.explanation || '';
        const expl = x.explanation && x.issue ? x.explanation : '';
        html += `
            <li class="flex flex-col gap-0.5">
              <span class="font-medium text-slate-800">• ${esc(issue)}</span>
              ${expl ? `<span class="text-sm text-slate-600 ml-4">${esc(expl)}</span>` : ''}
            </li>`;
      }
      html += `</ul></div>`;
    }
    html += `</div></div>`;
    return html;
  };

  const cityFromSlug = (d: any) => {
    const slug = d.slug || d.proposed_slug || '';
    const m = slug.match(/repair\/([^/]+)\//);
    return m ? m[1].charAt(0).toUpperCase() + m[1].slice(1) : (d.city || '');
  };
  const city = cityFromSlug(data);

  const DiagramWithBlurb = () => `
    <div class="mb-8">
      <img src="/images/hvac_system_main.svg.svg" alt="HVAC system decision flow: DIY-friendly vs professional required" class="w-full max-w-2xl mx-auto rounded-xl shadow-sm" />
      <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-sm text-slate-700 dark:text-slate-300 mt-4">
        Structural and mechanical issues are often DIY-friendly for simple fixes like airflow restrictions or minor cleaning. Electrical and refrigerant-related problems typically require professional service due to safety risks and system complexity.
      </div>
    </div>`;

  const CTASection = (compact = false) => {
    const cityPhrase = city ? ` in ${city}` : '';
    return compact
      ? `
    <div class="bg-slate-900 text-white p-4 rounded-xl text-center my-8">
      <p class="font-semibold mb-2">Need a pro? <a href="/repair" class="text-amber-400 hover:text-amber-300 underline">Get local HVAC quotes</a></p>
    </div>`
      : `
    <div class="bg-slate-900 text-white p-6 rounded-2xl text-center mt-10">
      <h3 class="text-xl font-semibold mb-2">Need HVAC Repair${cityPhrase}?</h3>
      <p class="mb-4 text-slate-300">Electrical and refrigerant issues are best handled by licensed technicians.</p>
      <a href="/repair" class="inline-block bg-amber-400 text-slate-900 px-6 py-2 rounded-lg font-semibold hover:bg-amber-300 transition-colors">Get Local HVAC Quotes</a>
    </div>`;
  };

  return `
    <div class="max-w-4xl mx-auto px-4 py-10 space-y-0">
      ${Hero(data)}
      ${MostLikelyFix(data)}
      ${DiagramWithBlurb()}
      ${CTASection(true)}
      ${StepsSection(data)}
      ${CostDifficulty(data)}
      ${ToolsParts(data)}
      ${SafetySection(data)}
      ${PillarBreakdown(data)}
      ${RepairOptionsByPillar(data)}
      ${RootCausesByPillar(data)}
      ${CTASection(false)}
    </div>
  `;
}

export function renderToHtml(aiData: any): string {
  let html = '';

  const pageType = (aiData.pageType || aiData.page_type || '').toLowerCase();
  const isContext = pageType === 'context' || (aiData.whyThisHappensInThisContext && Array.isArray(aiData.mostLikelyCauses));
  const isCondition = pageType === 'condition' || (aiData.whatThisMeans && (Array.isArray(aiData.likelyCauses) || Array.isArray(aiData.primaryCauses)));
  const isRepair = pageType === 'repair' || (aiData.stepsOverview && aiData.whatThisFixes);

  if (isRepair) {
    return renderRepairPage(aiData);
  }

  if (isContext) {
    const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const renderList = (arr: unknown[]) =>
      Array.isArray(arr) ? arr.map((s) => `<li>${esc(String(s))}</li>`).join('') : '';
    const renderCauseCards = (causes: unknown[]) =>
      Array.isArray(causes)
        ? causes
            .map(
              (c: any) =>
                `<div class="mb-4 p-4 bg-slate-50 rounded-lg"><strong>${esc(c?.cause ?? '')}</strong> (${esc(c?.likelihood ?? '')})<p class="mt-2 text-sm text-slate-600">${esc(c?.why ?? '')}</p></div>`
            )
            .join('')
        : '';

    const symptomSlug = aiData.parentSymptom || (aiData.slug || 'ac-blowing-warm-air').replace(/-while-.*$/, '').replace(/-when-.*$/, '').replace(/-in-.*$/, '') || 'ac-blowing-warm-air';
    const causes = (aiData.mostLikelyCauses ?? []).slice(0, 3);
    const repairs = (aiData.relatedRepairs ?? []).slice(0, 2);
    const causeLinks = causes.map((c: any) => link(`cause/${slugify(c?.cause ?? '')}`, c?.cause ?? '')).join(', ');
    const repairLinks = repairs.map((r: string) => link(`fix/${slugify(r)}`, r)).join(', ');

    const continueBlock = causes.length > 0
      ? `<div class="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl mt-6"><h3 class="font-bold text-slate-900 dark:text-white mb-2">Continue Diagnosis</h3><ul class="list-disc pl-5 space-y-1 text-sm">${causes.map((c: any) => `<li>Check: ${link(`cause/${slugify(c?.cause ?? '')}`, c?.cause ?? '')}</li>`).join('')}</ul></div>`
      : '';
    const fixBlock = repairs.length > 0
      ? `<div class="bg-blue-50 dark:bg-slate-800 p-4 rounded-xl mt-6"><h3 class="font-bold text-slate-900 dark:text-white mb-2">Fix This Issue</h3><ul class="list-disc pl-5 space-y-1 text-sm">${repairs.map((r: string) => `<li>${link(`fix/${slugify(r)}`, r)}</li>`).join('')}</ul></div>`
      : '';

    return `
    <h1>${esc(aiData.fastAnswer ?? '')}</h1>

    <h2>Why This Happens</h2>
    <p>${esc(aiData.whyThisHappensInThisContext ?? '')}</p>

    <h2>Most Likely Causes</h2>
    ${renderCauseCards(aiData.mostLikelyCauses ?? [])}

    <h2>What Makes This Different</h2>
    <ul>${renderList(aiData.whatMakesThisDifferent ?? [])}</ul>

    <h2>Quick Checks</h2>
    <ul>${renderList(aiData.quickChecks ?? [])}</ul>

    <h2>When to Worry</h2>
    <ul>${renderList(aiData.whenToWorry ?? [])}</ul>

    <h2>Related</h2>
    <p>Start with ${link(`diagnose/${slugify(symptomSlug)}`, 'full diagnosis')}</p>
    ${causeLinks ? `<p>Common causes: ${causeLinks}</p>` : ''}
    ${repairLinks ? `<p>Repairs: ${repairLinks}</p>` : ''}

    ${continueBlock}
    ${fixBlock}
  `;
  }

  if (isCondition) {
    const hasLocked = typeof aiData.fastAnswer === 'object' && aiData.fastAnswer?.headline && typeof aiData.thirtySecondSummary === 'object' && aiData.thirtySecondSummary?.whatItUsuallyMeans;
    if (hasLocked) {
      return '<div data-condition-template="locked">Condition page uses React template.</div>';
    }
    const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const renderList = (arr: unknown[]) =>
      Array.isArray(arr) ? arr.map((s) => `<li>${esc(String(s))}</li>`).join('') : '';
    const severity = aiData.severity as { level?: string; reason?: string } | undefined;
    const costRange = aiData.costRange as { low?: string; high?: string } | undefined;
    const costBreakdown = aiData.costBreakdown as { diy?: string; professional?: string } | undefined;
    const primaryCauses = (aiData.primaryCauses as { name?: string; likelihood?: string; why?: string }[]) ?? [];
    const likelyCauses = (aiData.likelyCauses as string[]) ?? [];
    const causes = primaryCauses.length ? primaryCauses.map((c) => c.name ?? c) : likelyCauses;
    const repairOpts = aiData.repairOptions;
    const repairItems = Array.isArray(repairOpts)
      ? repairOpts.map((r: unknown) => (typeof r === 'object' && r && 'name' in r) ? (r as { name: string }).name : String(r))
      : [];
    const continueBlock = causes.length > 0 ? `<div class="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl mt-6"><h3 class="font-bold text-slate-900 dark:text-white mb-2">Continue Diagnosis</h3><ul class="list-disc pl-5 space-y-1 text-sm">${causes.map((c) => `<li>Check: ${link(`cause/${slugify(typeof c === 'string' ? c : '' + c)}`, typeof c === 'string' ? c : '' + c)}</li>`).join('')}</ul></div>` : '';
    const fixBlock = repairItems.length > 0 ? `<div class="bg-blue-50 dark:bg-slate-800 p-4 rounded-xl mt-6"><h3 class="font-bold text-slate-900 dark:text-white mb-2">Fix This Issue</h3><ul class="list-disc pl-5 space-y-1 text-sm">${repairItems.slice(0, 4).map((r) => `<li>${link(`fix/${slugify(r)}`, r)}</li>`).join('')}</ul></div>` : '';
    const mermaidRaw = String(aiData.diagnosticFlowMermaid || '').trim();
    const mermaidBlock = mermaidRaw
      ? `<div class="mermaid my-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-x-auto">${mermaidRaw}</div>`
      : '';
    const symptoms = (aiData.symptomsYoullNotice as string[]) ?? (aiData.commonSymptoms as string[]) ?? [];
    const howToConfirm = (aiData.howToConfirm as string[]) ?? (aiData.diagnosticOverview as string[]) ?? [];
    const whenSerious = (aiData.whenItGetsSerious as string[]) ?? [];
    const related = (aiData.relatedConditions as string[]) ?? [];
    const cta = aiData.cta as string | undefined;
    return `
    <h1>${esc(aiData.title ?? aiData.fastAnswer ?? '')}</h1>
    <p class="text-lg text-slate-600 dark:text-slate-400 mb-6">${esc(aiData.fastAnswer ?? '')}</p>
    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-2">What This Problem Means</h2>
    <p>${esc(aiData.whatThisMeans ?? '')}</p>
    ${primaryCauses.length ? `<h2 class="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-2">Primary Causes</h2><div class="space-y-3">${primaryCauses.map((c) => `<div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"><strong>${esc(c.name ?? '')}</strong> (${esc(c.likelihood ?? '')})<p class="mt-1 text-sm text-slate-600 dark:text-slate-400">${esc(c.why ?? '')}</p></div>`).join('')}</div>` : ''}
    ${likelyCauses.length && !primaryCauses.length ? `<h2 class="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-2">Likely Causes</h2><ul>${renderList(likelyCauses)}</ul>` : ''}
    ${mermaidBlock}
    ${symptoms.length ? `<h2 class="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-2">Symptoms You'll Notice</h2><ul>${renderList(symptoms)}</ul>` : ''}
    ${howToConfirm.length ? `<h2 class="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-2">How to Confirm</h2><ol class="list-decimal pl-6 space-y-2">${howToConfirm.map((s) => `<li>${esc(String(s))}</li>`).join('')}</ol>` : ''}
    ${repairItems.length ? `<h2 class="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-2">Repair Options (DIY vs Pro)</h2><ul>${repairItems.map((r) => `<li>${link(`fix/${slugify(r)}`, r)}</li>`).join('')}</ul>` : ''}
    ${(costBreakdown?.diy || costBreakdown?.professional) ? `<p class="mt-4"><strong>Cost:</strong> DIY ${esc(costBreakdown.diy ?? '')} | Pro ${esc(costBreakdown.professional ?? '')}</p>` : ''}
    ${(costRange?.low || costRange?.high) ? `<p class="mt-2"><strong>Cost range:</strong> ${esc(costRange.low ?? '')} – ${esc(costRange.high ?? '')}</p>` : ''}
    ${severity ? `<p><strong>Severity:</strong> ${esc(severity.level ?? '')} — ${esc(severity.reason ?? '')}</p>` : ''}
    ${whenSerious.length ? `<h2 class="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-2">When It Gets Serious</h2><ul class="list-disc pl-5 text-amber-800 dark:text-amber-200">${renderList(whenSerious)}</ul>` : ''}
    ${(aiData.whenToAct as string[])?.length ? `<h2 class="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-2">When to Act</h2><ul>${renderList(aiData.whenToAct)}</ul>` : ''}
    ${related.length ? `<h2 class="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-2">Related Conditions</h2><ul>${renderList(related)}</ul>` : ''}
    ${cta ? `<div class="mt-8 p-4 bg-hvac-navy text-white rounded-xl"><p class="font-bold">${esc(cta)}</p><a href="/repair" class="inline-block mt-2 text-hvac-gold font-bold hover:underline">Get Local HVAC Quotes →</a></div>` : ''}
    ${continueBlock}
    ${fixBlock}
    ${(aiData.faq as { question: string; answer: string }[])?.length ? `<h2 class="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-2">FAQ</h2>${(aiData.faq as { question: string; answer: string }[]).map((f) => `<div class="mb-4"><strong>${esc(f.question)}</strong><p class="mt-1 text-slate-600 dark:text-slate-400">${esc(f.answer)}</p></div>`).join('')}` : ''}
  `;
  }

  // Section 1 - Fast Answer
  const fastAnswer = aiData.fast_answer || aiData.quick_answer || aiData.problem_summary;
  if (fastAnswer) {
    html += `
      <div class="fast-answer mb-10">
        <h2 class="text-xl font-extrabold uppercase tracking-wide text-slate-900 border-b-2 border-slate-900 pb-2 mb-4">Fast Answer</h2>
        <div class="text-[15px] text-slate-800 leading-relaxed font-medium">${formatTextSafe(String(fastAnswer))}</div>
        <div class="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg text-sm text-slate-800 font-medium space-y-2">
          <p><em>If this sounds like your issue, you'll need to diagnose the root cause immediately.</em></p>
          <p>Most homeowners fix this by comparing prices. <a href="/repair" class="underline font-bold text-hvac-blue hover:text-blue-800">Get quotes from local HVAC pros</a> to avoid worsening damage.</p>
        </div>
      </div>
    `;
  }

  // Section 2 - System Overview
  if (aiData.system_overview) {
    html += `
      <div class="system-overview mb-10">
        <h2 class="text-xl font-extrabold uppercase tracking-wide text-slate-900 border-b-2 border-slate-900 pb-2 mb-4">System Overview</h2>
        <div class="text-[15px] text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">${aiData.system_overview}</div>
      </div>
    `;
  }

  // Section 3 - Diagnostic Overview Panel
  if (aiData.diagnostic_overview) {
    html += `
      <div class="diagnostic-overview bg-hvac-navy text-white rounded-lg shadow-md mb-10 overflow-hidden border border-slate-700">
        <div class="bg-slate-900 px-6 py-3 border-b border-slate-700">
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <svg class="w-4 h-4 text-hvac-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>
            System Diagnostic Profile
          </h3>
        </div>
        <div class="p-6">
          <ul class="grid sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
            <li class="flex flex-col">
              <span class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">System</span>
              <span class="font-bold text-white text-base">${aiData.diagnostic_overview.system || 'N/A'}</span>
            </li>
            <li class="flex flex-col">
              <span class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Operating Mode</span>
              <span class="font-bold text-white text-base">${aiData.diagnostic_overview.operating_mode || 'N/A'}</span>
            </li>
            <li class="flex flex-col">
              <span class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Diagnostic Path</span>
              <span class="font-bold text-hvac-gold text-base">${aiData.diagnostic_overview.component_path || 'N/A'}</span>
            </li>
            <li class="flex flex-col">
              <span class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Category</span>
              <span class="font-bold text-white text-base">${aiData.diagnostic_overview.symptom_category || 'N/A'}</span>
            </li>
            <li class="flex flex-col">
              <span class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Environment</span>
              <span class="font-bold text-white text-base">${aiData.diagnostic_overview.environment || 'N/A'}</span>
            </li>
          </ul>
        </div>
      </div>
    `;
  }

  // Section 4 & 5 - Confidence Box & Severity Indicator
  const confidenceScore = aiData.confidence_score;
  const confidenceBox = aiData.confidence_box || (confidenceScore != null ? `High (${confidenceScore}%)` : null);
  if (confidenceBox || aiData.severity_indicator) {
    html += `<div class="grid md:grid-cols-2 gap-6 mb-12">`;
    
    // Confidence Box
    if (confidenceBox) {
      html += `
        <div class="confidence-panel bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-full relative overflow-hidden">
          <div class="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
          <div class="p-5">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Diagnostic Confidence</h3>
            <p class="text-xl font-bold text-slate-900">${confidenceBox}</p>
          </div>
        </div>
      `;
    }

    // Severity Indicator
    if (aiData.severity_indicator) {
      const isCritical = normalizeToString(aiData.severity_indicator.severity).toLowerCase().includes('critical') || normalizeToString(aiData.severity_indicator.severity).toLowerCase().includes('high');
      const sevColor = isCritical ? 'bg-red-600' : 'bg-amber-500';
      const sevBg = isCritical ? 'bg-red-50' : 'bg-amber-50';
      const sevText = isCritical ? 'text-red-900' : 'text-amber-900';
      const sevBorder = isCritical ? 'border-red-200' : 'border-amber-200';
      
      html += `
        <div class="severity-panel ${sevBg} border ${sevBorder} rounded-lg shadow-sm flex flex-col h-full relative overflow-hidden">
          <div class="absolute top-0 left-0 w-1.5 h-full ${sevColor}"></div>
          <div class="p-5">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-xs font-bold uppercase tracking-wider ${sevText} opacity-80">Problem Severity</h3>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white ${sevColor}">${aiData.severity_indicator.severity}</span>
            </div>
            <p class="text-[13px] ${sevText} font-medium mb-1"><strong class="font-bold opacity-75 mr-1">Risk if ignored:</strong> ${aiData.severity_indicator.risk_if_ignored}</p>
            <p class="text-[13px] ${sevText} font-medium mb-1"><strong class="font-bold opacity-75 mr-1">Failure window:</strong> ${aiData.severity_indicator.estimated_failure_window}</p>
            <p class="text-[13px] ${sevText} font-medium"><strong class="font-bold opacity-75 mr-1">Urgency:</strong> ${aiData.severity_indicator.repair_urgency || 'N/A'}</p>
          </div>
        </div>
      `;
    }
    
    html += `</div>`;
  }

  // Technical Diagnostic Procedure
  const diagnosticSteps = aiData.diagnostics || aiData.diagnostic_steps || [];
  if (diagnosticSteps.length > 0) {
    html += `<div class="diagnostic-steps-section mb-12">
      <h2 class="text-xl font-extrabold uppercase tracking-wide text-slate-900 border-b-2 border-slate-900 pb-2 mb-6">Technical Diagnostic Procedure</h2>
      <ol class="space-y-4 list-decimal list-inside">`;
    diagnosticSteps.forEach((s: any, i: number) => {
      const step = typeof s === 'string' ? s : (s.step || s.action || '');
      const action = typeof s === 'object' && s.action ? s.action : (s.check_for || '');
      const nextTrue = typeof s === 'object' && s.next_if_true ? ` → ${s.next_if_true}` : '';
      const nextFalse = typeof s === 'object' && s.next_if_false ? ` (else: ${s.next_if_false})` : '';
      html += `<li class="text-[15px] text-slate-800 font-medium"><strong>${step}</strong>${action ? ` — ${action}` : ''}${nextTrue}${nextFalse}</li>`;
    });
    html += `</ol></div>`;
  }

  // Section 7 - Common Causes (Root Cause Analysis breakdown)
  if (aiData.causes && aiData.causes.length > 0) {
    html += `<div class="diagnostic-causes mb-12">`;
    html += `<h2 class="text-xl font-extrabold uppercase tracking-wide text-slate-900 border-b-2 border-slate-900 pb-2 mb-6">Root Cause Analysis</h2>`;
    html += `<div class="space-y-6">`;
    aiData.causes.forEach((cause: any, idx: number) => {
      html += `
        <div class="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
           <div class="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center gap-3">
             <span class="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold">${idx + 1}</span>
             <h3 class="font-bold text-lg text-slate-900">${cause.name}</h3>
           </div>
           <div class="p-5">
             <div class="grid md:grid-cols-2 gap-4 mb-5 p-4 bg-slate-50 rounded border border-slate-100">
               <div>
                 <span class="text-[10px] font-bold uppercase text-slate-500 tracking-widest block mb-1">Failure Mechanism / Symptoms</span>
                 <p class="text-[13px] text-slate-800 font-medium">${cause.mechanism || cause.symptoms || cause.indicator || 'N/A'}</p>
               </div>
               <div>
                 <span class="text-[10px] font-bold uppercase text-slate-500 tracking-widest block mb-1">Diagnostic Clues / Indicator</span>
                 <p class="text-[13px] text-slate-800 font-medium">${cause.diagnostic_clues || cause.indicator || 'N/A'}</p>
               </div>
             </div>
             
             <div class="grid md:grid-cols-2 gap-6">
               <div>
                 <span class="text-xs font-bold uppercase tracking-wider text-slate-800 block mb-2 border-b border-slate-200 pb-1">Technical Explanation</span>
                 <div class="text-[13px] text-slate-600 whitespace-pre-wrap leading-relaxed">${cause.explanation || ''}</div>
               </div>
               <div>
                 <span class="text-xs font-bold uppercase tracking-wider text-slate-800 block mb-2 border-b border-slate-200 pb-1">Root Cause Analysis</span>
                 <div class="text-[13px] text-slate-600 whitespace-pre-wrap leading-relaxed">${cause.root_cause_analysis || ''}</div>
               </div>
             </div>
           </div>
        </div>
      `;
    });
    html += `</div></div>`;
  }

  // Section 8 - Diagnostic Tests
  if (aiData.diagnostic_tests && aiData.diagnostic_tests.length > 0) {
    html += `<div class="diagnostic-tests-section my-12">
      <h2 class="text-xl font-extrabold uppercase tracking-wide text-slate-900 border-b-2 border-slate-900 pb-2 mb-6">Diagnostic Procedures</h2>
      <div class="grid lg:grid-cols-2 gap-6">`;
    
    aiData.diagnostic_tests.forEach((test: any) => {
      html += `
        <div class="bg-white border-2 border-slate-200 rounded-lg overflow-hidden flex flex-col h-full">
          <div class="bg-slate-100 border-b-2 border-slate-200 px-4 py-3">
             <h3 class="text-sm font-bold uppercase tracking-wider text-slate-800">${test.name}</h3>
          </div>
          <div class="p-4 flex-grow flex flex-col">
            <div class="mb-4 bg-blue-50/50 p-3 rounded border border-blue-100">
               <span class="text-[10px] font-bold uppercase tracking-widest text-blue-800 block mb-2">Required Tools</span>
               <div class="flex flex-wrap gap-1.5">
                 ${(test.tools || []).map((t: string) => `<span class="bg-white border border-blue-200 text-blue-800 text-[11px] font-medium px-2 py-0.5 rounded-sm shadow-sm">${t}</span>`).join('')}
               </div>
            </div>
            
            <div class="flex-grow">
              <span class="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Step-by-Step Execution</span>
              <ul class="space-y-2">
                ${(test.steps || []).map((s: string, i: number) => `
                  <li class="flex gap-2 text-[13px] text-slate-700 leading-snug">
                    <span class="font-bold tracking-tighter text-slate-400 mt-0.5">${i + 1}.</span>
                    <span>${s}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
        </div>
      `;
    });
    html += `</div></div>`;
  }

  // Tools Required (standalone when tools array exists)
  if (aiData.tools && aiData.tools.length > 0) {
    html += `<div class="tools-section my-12">
      <h2 class="text-xl font-extrabold uppercase tracking-wide text-slate-900 border-b-2 border-slate-900 pb-2 mb-6">Tools Required</h2>
      <div class="flex flex-wrap gap-2">`;
    aiData.tools.forEach((t: any) => {
      const name = typeof t === 'string' ? t : (t.name || '');
      const url = typeof t === 'object' && t.url ? t.url : null;
      html += url
        ? `<a href="${url}" class="bg-white border border-slate-200 text-slate-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:border-hvac-blue hover:text-hvac-blue transition-colors">${name}</a>`
        : `<span class="bg-slate-100 border border-slate-200 text-slate-700 text-sm font-medium px-3 py-1.5 rounded-lg">${name}</span>`;
    });
    html += `</div></div>`;
  }

  // Section 9 - Repair Options
  if (aiData.repairs && aiData.repairs.length > 0) {
    html += `<div class="repairs-section my-12">
      <h2 class="text-xl font-extrabold uppercase tracking-wide text-slate-900 border-b-2 border-slate-900 pb-2 mb-6">Authorized Repair Paths</h2>
      <div class="overflow-x-auto rounded-lg shadow-sm border border-slate-300">
        <table class="w-full text-left border-collapse bg-white">
          <thead class="bg-slate-100 border-b-2 border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-700">
            <tr>
              <th class="py-3 px-4 w-1/4">Repair Profile</th>
              <th class="py-3 px-4 w-1/2">Technical Scope</th>
              <th class="py-3 px-4 w-auto">Est. Cost</th>
              <th class="py-3 px-4 w-auto">Difficulty</th>
              <th class="py-3 px-4 w-auto">Time</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">`;
    
    aiData.repairs.forEach((repair: any) => {
      // Determine difficulty pill color
      let diffColor = 'bg-slate-100 text-slate-600 border-slate-200';
      const diffLower = normalizeToString(repair.difficulty).toLowerCase();
      if (diffLower.includes('high') || diffLower.includes('expert') || diffLower.includes('hard') || diffLower.includes('pro')) diffColor = 'bg-red-50 text-red-700 border-red-200';
      else if (diffLower.includes('medium') || diffLower.includes('moderate')) diffColor = 'bg-amber-50 text-amber-700 border-amber-200';
      else if (diffLower.includes('low') || diffLower.includes('easy') || diffLower.includes('diy')) diffColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';

      html += `<tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-4 align-top">
          <div class="font-semibold text-sm text-slate-900 pr-2">${repair.name}</div>
        </td>
        <td class="py-3 px-4 align-top">
          <div class="text-[13px] text-slate-600 leading-relaxed max-w-lg mb-1">${repair.explanation || repair.fix_summary || '—'}</div>
        </td>
        <td class="py-3 px-4 align-top">
          <div class="font-mono text-sm font-semibold text-slate-800 whitespace-nowrap">${repair.cost || repair.estimated_cost || 'N/A'}</div>
        </td>
        <td class="py-3 px-4 align-top">
          <span class="inline-block border px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${diffColor}">${repair.difficulty || 'UNKNOWN'}</span>
        </td>
        <td class="py-3 px-4 align-top">
          <div class="text-[13px] text-slate-600">${repair.repair_time || '—'}</div>
        </td>
      </tr>`;
    });
    
    html += `</tbody></table></div></div>`;
  }

  // Section 10 - Components
  if (aiData.components && aiData.components.length > 0) {
    html += `<div class="components-section my-12">
      <h2 class="text-xl font-extrabold uppercase tracking-wide text-slate-900 border-b-2 border-slate-900 pb-2 mb-6">System Components Involved</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">`;
    aiData.components.forEach((comp: any) => {
      html += `
        <div class="bg-white border-2 border-slate-200 hover:border-slate-400 p-4 rounded-lg shadow-sm transition group cursor-default">
           <h4 class="font-bold text-sm uppercase tracking-tight text-slate-900 mb-1 line-clamp-2">${comp.name}</h4>
           ${comp.description ? `<p class="text-[11px] font-medium text-slate-500 leading-tight line-clamp-3">${comp.description}</p>` : ''}
        </div>
      `;
    });
    html += `</div></div>`;
  }

  // Section 11 - Field Technician Notes
  const fieldNotes = aiData.field_notes || aiData.field_note;
  if (fieldNotes) {
    html += `
      <div class="field-note-panel bg-yellow-50 p-6 rounded-lg my-12 border border-yellow-300 relative overflow-hidden shadow-sm">
        <div class="absolute top-0 left-0 w-1.5 h-full bg-hvac-gold"></div>
        <h3 class="text-sm font-bold tracking-widest uppercase text-yellow-900 mb-2 flex items-center gap-2">
           <svg class="w-4 h-4 text-hvac-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0z"></path></svg>
           Field Technician Notes
        </h3>
        <div class="text-[14px] text-yellow-900 font-medium whitespace-pre-wrap leading-relaxed">"${fieldNotes}"</div>
      </div>
    `;
  }

  // Preventative Maintenance
  if (aiData.prevention) {
    html += `
      <div class="prevention-panel bg-emerald-50 p-6 rounded-lg my-12 border border-emerald-200 relative overflow-hidden shadow-sm">
        <div class="absolute top-0 left-0 w-1.5 h-full bg-emerald-600"></div>
        <h3 class="text-sm font-bold tracking-widest uppercase text-emerald-900 mb-2 flex items-center gap-2">
           Preventative Maintenance
        </h3>
        <div class="text-[14px] text-emerald-900 font-medium whitespace-pre-wrap leading-relaxed">${aiData.prevention}</div>
      </div>
    `;
  }

  // Section 12 - Related Diagnostic Paths / Internal Links
  const relatedLinks = aiData.internal_links || aiData.related_diagnostics || [];
  if (relatedLinks.length > 0) {
    html += `<div class="related-section my-12 pb-8">
      <h2 class="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Related Diagnostic Vectors</h2>
      <ul class="flex flex-wrap gap-2">`;
    relatedLinks.forEach((rel: any) => {
      html += `<li><span class="inline-block bg-slate-100 border border-slate-200 text-slate-700 text-[11px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-sm">${rel.name}</span></li>`;
    });
    html += `</ul></div>`;
  }

  // Link blocks — 1 parent, 2 causes, 1 repair (minimum viable)
  const causes = (aiData.rankedCauses ?? aiData.causes ?? aiData.mostLikelyCauses ?? []).slice(0, 3);
  const repairs = (aiData.repairOptions ?? aiData.repairs ?? aiData.relatedRepairs ?? []).slice(0, 2);
  const causeNames = causes.map((c: any) => (typeof c === 'string' ? c : c?.name ?? c?.cause ?? '')).filter(Boolean);
  const repairNames = repairs.map((r: any) => (typeof r === 'string' ? r : r?.name ?? '')).filter(Boolean);

  if (causeNames.length > 0 || repairNames.length > 0) {
    html += `<div class="link-blocks mt-8 space-y-4">`;
    if (causeNames.length > 0) {
      html += `<div class="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl"><h3 class="font-bold text-slate-900 dark:text-white mb-2">Continue Diagnosis</h3><ul class="list-disc pl-5 space-y-1 text-sm">`;
      causeNames.slice(0, 3).forEach((name: string) => {
        html += `<li>Check: ${link(`cause/${slugify(name)}`, name)}</li>`;
      });
      html += `</ul></div>`;
    }
    if (repairNames.length > 0) {
      html += `<div class="bg-blue-50 dark:bg-slate-800 p-4 rounded-xl"><h3 class="font-bold text-slate-900 dark:text-white mb-2">Fix This Issue</h3><ul class="list-disc pl-5 space-y-1 text-sm">`;
      repairNames.slice(0, 2).forEach((name: string) => {
        html += `<li>${link(`fix/${slugify(name)}`, name)}</li>`;
      });
      html += `</ul></div>`;
    }
    html += `</div>`;
  }

  // --- MONETIZATION LAYER (Lead Gen CTA + Affiliate Block) ---
  html += `
    <div class="affiliate-block bg-white p-6 rounded-lg my-12 border border-slate-200 shadow-sm text-center">
      <h3 class="text-lg font-bold uppercase tracking-wider text-slate-900 mb-4">Recommended Tools</h3>
      <div class="flex flex-wrap items-center justify-center gap-4">
        <a href="#" class="px-4 py-2 border border-hvac-navy text-hvac-navy font-bold rounded-md hover:bg-hvac-navy hover:text-white transition">Air Filter</a>
        <a href="#" class="px-4 py-2 border border-hvac-navy text-hvac-navy font-bold rounded-md hover:bg-hvac-navy hover:text-white transition">Multimeter</a>
        <a href="#" class="px-4 py-2 border border-hvac-navy text-hvac-navy font-bold rounded-md hover:bg-hvac-navy hover:text-white transition">Coil Cleaner</a>
      </div>
    </div>
  `;

  html += `
    <section class="cta bg-hvac-navy text-white text-center p-8 rounded-xl my-12 shadow-md">
      <h2 class="text-2xl font-bold mb-2">Need Help Fixing This?</h2>
      <p class="text-slate-200 mb-6">Get quotes from local HVAC pros.</p>
      <a href="/repair" class="bg-hvac-gold text-slate-900 font-extrabold px-8 py-3 rounded-md hover:bg-yellow-400 transition cursor-pointer text-lg inline-block">Get Free Estimates</a>
    </section>
  `;

  // --- RELATED Graph Links (SEO) ---
  // SEO links are now rendered defensively in React templates, not injected as string html

  return html;
}

