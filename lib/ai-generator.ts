import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const MASTER_PROMPT = `
HVAC Revenue Boost – Technical Service Manual Generator

SYSTEM ROLE

You are a 20-year HVAC service technician, mechanical systems engineer, and technical manual author.

You have:
• 20+ years residential HVAC service experience
• EPA 608 certification
• experience diagnosing compressors, refrigerant systems, airflow problems, and electrical faults
• experience training junior technicians

You write like a service manual author or field trainer, not a blogger.

Your job is to create highly technical residential HVAC diagnostic guides that function like repair manuals.

The content must resemble:
• manufacturer troubleshooting manuals
• field technician repair guides
• service training documents

Avoid generic advice.

Assume the reader is:
• homeowner attempting diagnosis
• apprentice technician
• contractor researching symptoms

CONTENT OBJECTIVES

Each page must accomplish three goals:
1. Diagnose HVAC failures
2. Educate the homeowner
3. Generate HVAC service leads

TECHNICAL STANDARD

All content must reference real HVAC service measurements, including:
• voltage readings
• capacitor microfarads
• refrigerant pressure ranges
• airflow CFM values
• static pressure limits
• temperature split across evaporator coil

Examples:

Typical residential HVAC values:
- Temperature split across evaporator coil: 16°F – 22°F
- Capacitor tolerance: ±6%
- Typical residential static pressure: 0.5 in WC
- Typical refrigerant pressures (R410A cooling): Low side 115-140 psi, High side 350-450 psi

KNOWLEDGE GRAPH ARCHITECTURE

SYSTEM → SYMPTOM → CONDITION → CAUSE → REPAIR → COMPONENT

Example: Central AC → AC blowing warm air → Outdoor unit running but compressor not starting → Failed capacitor → Replace capacitor → AC dual run capacitor

Pages must reference connected nodes to create deep internal linking.

PAGE TYPES: System Pillar, Symptom, Condition, Cause, Repair, Component, Location

PAGE STRUCTURE

Every page must include:

1. FAST ANSWER — 30-second explanation. Example: "If your AC is blowing warm air, the most common causes are a failed capacitor, low refrigerant charge, or a compressor that is not starting even though the outdoor fan is running."

2. SYSTEM OVERVIEW — Relevant HVAC system components involved (compressor, condenser coil, metering device, evaporator coil).

3. TECHNICAL DIAGNOSTIC PROCEDURE — Step-by-step troubleshooting with voltage checks, capacitor tests, refrigerant pressure checks.

4. COMMON CAUSES — Minimum 3 causes. Each: explanation, symptoms, diagnostic confirmation.

5. REPAIR OPTIONS — Minimum 5 repairs. Each: difficulty, cost, time.

6. TOOLS REQUIRED — multimeter, manifold gauge set, vacuum pump, refrigerant scale, clamp meter.

7. MERMAID DIAGNOSTIC TREE — Decision tree. Example: graph TD A[AC blowing warm air] --> B{Outdoor unit running?} B -->|Yes| C[Test capacitor] B -->|No| D[Check breaker]

8. FIELD TECHNICIAN NOTES — Real service call insights (100+ words).

9. PREVENTATIVE MAINTENANCE — How to prevent recurrence.

10. LEAD GENERATION — Service CTA.

OUTPUT: Strict JSON. No pre-built HTML.
`;

export async function generatePageContent(pageSlug: string, pageType: string, pageTitle: string, additionalContext: any = {}) {
  const systemPrompt = `
    ${MASTER_PROMPT}

    Current Page Configuration:
    - Page Type: ${pageType}
    - Proposed Slug: ${pageSlug}
    - Title/Topic: ${pageTitle}
    
    CRITICAL OUTPUT INSTRUCTIONS:
    Provide the response strictly as a JSON object matching this schema:
    {
       "title": "AC Blowing Warm Air? Causes, Diagnosis, Repair Cost",
       "slug": "page-slug",
       "fast_answer": "30-second explanation of the problem",
       "system_overview": "Explain relevant HVAC system components (compressor, condenser coil, metering device, evaporator coil)",
       "diagnostics": [
         { "step": "Step 1 — Confirm thermostat call", "action": "Verify 24V between Y and C at control board" },
         { "step": "Step 2 — Inspect outdoor condenser", "action": "Observe condenser fan and compressor" },
         { "step": "Step 3 — Test capacitor", "action": "Measure microfarads, acceptable ±6%" },
         { "step": "Step 4 — Check refrigerant pressures", "action": "R410A: Low 115-140 psi, High 350-450 psi" }
       ],
       "causes": [
         { "name": "Failed Capacitor", "explanation": "Technical explanation", "symptoms": "compressor hums, outdoor fan running, breaker not tripped", "diagnostic_clues": "Capacitor reading below tolerance" }
       ],
       "repairs": [
         { "name": "Replace capacitor", "cost": "$150-$350", "difficulty": "Easy", "repair_time": "1 hour" }
       ],
       "tools": ["multimeter", "manifold gauge set", "vacuum pump", "refrigerant scale", "clamp meter"],
       "mermaid_graph": "graph TD\\\\nA[AC blowing warm air] --> B{Outdoor unit running?}\\\\nB -->|Yes| C[Test capacitor]\\\\nB -->|No| D[Check breaker]",
       "field_notes": "Real service call insights (100+ words). Example: In real service calls, a failed capacitor accounts for nearly 40% of warm air complaints.",
       "prevention": "Annual maintenance: capacitor inspection, coil cleaning, refrigerant pressure check",
       "internal_links": [{ "name": "Related Page", "url": "/path" }]
    }
    
    ADDITIONAL CONTEXT:
    ${JSON.stringify(additionalContext, null, 2)}
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 4000, // 1200-1800 word equivalent in structured output
  });

  const contentStr = response.choices[0].message.content;
  if (!contentStr) {
    throw new Error("Failed to generate content: empty response");
  }

  const aiData = JSON.parse(contentStr);

  // Validation Rules (HVAC Revenue Boost)
  if (aiData.causes && aiData.causes.length < 3 && ['symptom', 'condition', 'cause'].includes(pageType)) {
    console.warn('⚠️ Validation Warning: Less than 3 causes generated.');
  }
  if (aiData.repairs && aiData.repairs.length < 5 && ['symptom', 'cause', 'repair'].includes(pageType)) {
    console.warn('⚠️ Validation Warning: Less than 5 repairs generated.');
  }
  if (!aiData.mermaid_graph && ['symptom', 'diagnostic', 'cluster', 'condition'].includes(pageType)) {
    console.warn('⚠️ Validation Warning: Missing mermaid diagram.');
  }
  const fieldNote = aiData.field_notes || aiData.field_note;
  if (!fieldNote || fieldNote.length < 50) {
    console.warn('⚠️ Validation Warning: Field notes should be 100+ words.');
  }

  return aiData;
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
  if (aiData.confidence_box || aiData.severity_indicator) {
    html += `<div class="grid md:grid-cols-2 gap-6 mb-12">`;
    
    // Confidence Box
    if (aiData.confidence_box) {
      html += `
        <div class="confidence-panel bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-full relative overflow-hidden">
          <div class="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
          <div class="p-5">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Diagnostic Confidence</h3>
            <p class="text-xl font-bold text-slate-900">${aiData.confidence_box}</p>
          </div>
        </div>
      `;
    }

    // Severity Indicator
    if (aiData.severity_indicator) {
      const isCritical = aiData.severity_indicator.severity?.toLowerCase().includes('critical') || aiData.severity_indicator.severity?.toLowerCase().includes('high');
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
      const action = typeof s === 'object' && s.action ? s.action : '';
      html += `<li class="text-[15px] text-slate-800 font-medium"><strong>${step}</strong>${action ? ` — ${action}` : ''}</li>`;
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
                 <p class="text-[13px] text-slate-800 font-medium">${cause.mechanism || cause.symptoms || 'N/A'}</p>
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
      const diffLower = (repair.difficulty || '').toLowerCase();
      if (diffLower.includes('high') || diffLower.includes('expert') || diffLower.includes('hard') || diffLower.includes('pro')) diffColor = 'bg-red-50 text-red-700 border-red-200';
      else if (diffLower.includes('medium') || diffLower.includes('moderate')) diffColor = 'bg-amber-50 text-amber-700 border-amber-200';
      else if (diffLower.includes('low') || diffLower.includes('easy') || diffLower.includes('diy')) diffColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';

      html += `<tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-4 align-top">
          <div class="font-semibold text-sm text-slate-900 pr-2">${repair.name}</div>
        </td>
        <td class="py-3 px-4 align-top">
          <div class="text-[13px] text-slate-600 leading-relaxed max-w-lg mb-1">${repair.explanation}</div>
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

