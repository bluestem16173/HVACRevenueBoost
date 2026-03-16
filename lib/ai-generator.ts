import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import { canBuildFromGraph, buildPageFromGraph } from './deterministic-page-builder';
import { getMasterSystemPrompt } from '@/prompts/master';
import { normalizeToString } from '@/lib/utils';
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

/** Pass 1: Strict JSON schema for core data (schema-critical) */
const PASS1_SCHEMA = {
  type: 'object' as const,
  additionalProperties: false,
  properties: {
    summary: { type: 'string', description: '1 sentence summary' },
    causes: {
      type: 'array',
      minItems: 3,
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          indicator: { type: 'string', description: 'short diagnostic clue' },
        },
        required: ['name', 'indicator'],
      },
    },
    repairs: {
      type: 'array',
      minItems: 4,
      maxItems: 10,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          difficulty: { type: 'string', enum: ['easy', 'moderate', 'advanced'] },
          estimated_cost: { type: 'string' },
          fix_summary: { type: 'string', description: '1 sentence' },
        },
        required: ['name', 'difficulty', 'estimated_cost', 'fix_summary'],
      },
    },
    diagnostic_steps: {
      type: 'array',
      minItems: 4,
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          step: { type: 'string' },
          check_for: { type: 'string' },
          next_if_true: { type: 'string' },
          next_if_false: { type: 'string' },
        },
        required: ['step', 'check_for', 'next_if_true', 'next_if_false'],
      },
    },
  },
  required: ['summary', 'causes', 'repairs', 'diagnostic_steps'],
};

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

/** Pass 1: Core structured data — schema enforces output shape */
const PASS1_PROMPT = `Return only data needed for a technical diagnostic page. JSON only—no markdown, no explanations.

CRITICAL: Each cause must include ≥ 2 repair options. Total repair options across all causes must be ≥ 5.

Content rules:
- Use concise technician-style wording.
- Prioritize real-world diagnostic clues.
- Avoid filler. Do not repeat causes or repairs.
- Summary must be 1 sentence.
- Generate exactly 3 causes.
- Generate exactly 5 repairs (minimum).
- Generate exactly 4 diagnostic steps.

Causes must be plausible for the exact symptom/condition pair. Repairs must map logically to causes.`;

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

export function validateCoreData(core: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!core?.causes?.length) errors.push('Missing causes');
  if (core?.causes?.length < 3) errors.push('Need at least 3 causes');

  const repairCount =
    (core?.repairs?.length ?? 0) +
    (core?.causes ?? []).reduce((sum: number, c: any) => sum + (c.repair_options?.length ?? 0), 0);
  if (repairCount < 5) errors.push(`Need at least 5 total repair options (got ${repairCount})`);

  return { valid: errors.length === 0, errors };
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

export async function generateCoreData(
  pageSlug: string,
  pageType: string,
  pageTitle: string,
  context: { system?: string; symptom?: string; condition?: string; environment?: string; vehicle?: string } = {}
) {
  const system = context.system || 'Central Air Conditioner';
  const symptom = context.symptom || pageTitle;
  const condition = context.condition || '';
  const environment = context.environment || 'Residential';
  const vehicle = context.vehicle || '';
  const { pass1 } = getTokenBudget(pageType);

  const userMsg = `Context:
System: ${system}
Symptom: ${symptom}
Condition: ${condition}
Environment: ${environment}
Unit: ${vehicle}

Page: ${pageSlug} (${pageType})

Authoring intent: This content is for a highly technical repair knowledge graph used for SEO and lead generation. It should read like a field technician's structured diagnostic output, not a consumer blog post.`;

  const systemPrompt = composeSystemPrompt(PASS1_PROMPT);

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
          name: 'core_page',
          strict: true,
          schema: PASS1_SCHEMA as Record<string, unknown>,
        },
      },
      temperature: 0.2,
      max_tokens: pass1,
    });

    const contentStr = response.choices[0]?.message?.content;
    if (!contentStr) throw new Error('Pass 1: empty response');
    return JSON.parse(contentStr);
  });
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
    return JSON.parse(contentStr);
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
    return JSON.parse(contentStr);
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

  const { valid, errors } = validateCoreData(core);
  if (!valid) {
    console.warn('⚠️ Core validation:', errors.join(', '));
  }

  console.log('📦 Pass 2: Generating enrichment...');
  const enrichment = await generateEnrichment(core, pageTitle, pageType);

  const merged = mergeJSON(core, enrichment);

  merged.title = merged.title || `${pageTitle} | Causes, Diagnosis, Repair Cost`;
  merged.slug = merged.slug || pageSlug;
  merged.fast_answer = merged.fast_answer || merged.summary;
  merged.diagnostics = merged.diagnostics || merged.diagnostic_steps;

  return merged;
}

export function renderToHtml(aiData: any): string {
  let html = '';

  // Section 1 - Fast Answer
  const fastAnswer = aiData.fast_answer || aiData.quick_answer || aiData.problem_summary;
  if (fastAnswer) {
    html += `
      <div class="fast-answer mb-10">
        <h2 class="text-xl font-extrabold uppercase tracking-wide text-slate-900 border-b-2 border-slate-900 pb-2 mb-4">Fast Answer</h2>
        <div class="text-[15px] text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">${fastAnswer}</div>
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

  return html;
}

