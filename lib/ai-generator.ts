import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const MASTER_PROMPT = `
HVAC Diagnostic Authority Page Layout
Writing

We are standardizing all HVAC diagnostic pages to use a professional diagnostic interface.

Pages must resemble technical troubleshooting documentation used by service technicians rather than blog articles.

All pages must follow the exact section order defined below.

The generator should return structured JSON content that is rendered by React components.

Do not return pre-built HTML. Return structured sections.

Page Layout Wireframe

All diagnostic pages must render the following sections.

Page Header
↓
Problem Summary
↓
Diagnostic Overview Panel
↓
Confidence Box
↓
Severity Indicator
↓
Diagnostic Flowchart
↓
Common Causes
↓
Diagnostic Tests
↓
Repair Options
↓
Components / Tools
↓
Field Technician Note
↓
Related Diagnostic Paths
↓
Local HVAC Service CTA

Section 1 — Page Header
The header displays the main symptom or condition.

Section 2 — Problem Summary
Short technical explanation of the issue (2-3 paragraphs).

Section 3 — Diagnostic Overview Panel
This panel mimics a professional diagnostic system context. Display structured metadata: System, Component Path, Operating Mode, Symptom Category, Environment.

Section 4 — Confidence Box
Display diagnostic certainty. Use a visual indicator: Low / Medium / High.

Section 5 — Severity Indicator
Show structured risk indicators: Severity, Risk if Ignored, Estimated Failure Window, Repair Urgency.

Section 6 — Diagnostic Flowchart
Render the Mermaid diagnostic tree returned by the AI (Start node, minimum 7 nodes, realistic logic, valid mermaid syntax).

Section 7 — Common Causes
Each cause must render in a card layout. Fields per cause: Cause Title, Technical Explanation, Diagnostic Tests, Repair Links. Minimum causes required: 3 causes. Each technical explanation and root cause analysis should be at least 100 words and formatted with markdown bullet points where appropriate.

Section 8 — Diagnostic Tests
Show technician verification procedures. Each test contains: Test Name, Tools Required, Procedure Steps.

Section 9 — Repair Options
Render repair cards. Fields: Repair Name, Description, Difficulty, Estimated Cost. Minimum repairs required: 5 repair options.

Section 10 — Components / Tools
Render a grid of parts and tools linking to related pages.

Section 11 — Field Technician Note
Highlighted callout box containing a 100+ word technical observation.

Section 12 — Related Diagnostic Paths
Pull related nodes (4-8 links).

Section 13 — Local HVAC Service CTA
Lead generation hook pointing to /hvac-repair/{city}/{symptom}.

Styling & Content Requirements
- AI output must strictly conform to these sections.
- Tone must be technical service manual.
- Use structured data.
- Minimum 3 causes (100+ words each).
- Minimum 5 repair paths.
- Mermaid graph required.
- 100+ word field note required.
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
       "content": "Overall introductory text / System Context",
       "problem_summary": "Short technical explanation of the issue (2-3 paragraphs)",
       "diagnostic_overview": {
          "system": "...",
          "component_path": "...",
          "operating_mode": "...",
          "symptom_category": "...",
          "environment": "..."
       },
       "confidence_box": "Low/Medium/High",
       "severity_indicator": {
          "severity": "Low/Moderate/High/Critical",
          "risk_if_ignored": "Brief explanation",
          "estimated_failure_window": "Timeframe",
          "repair_urgency": "..."
       },
       "mermaid_graph": "graph TD\\\\n...",
       "causes": [
         { "name": "Cause Name", "mechanism": "...", "indicator": "...", "root_cause_analysis": "100+ words formatting with markdown bullet points...", "explanation": "..." }
       ],
       "diagnostic_tests": [
         { "name": "Test Name", "tools": ["Tool 1", "Tool 2"], "steps": ["Step 1", "Step 2", "Step 3"] }
       ],
       "repairs": [
         { "name": "Repair Name", "explanation": "...", "cost": "$100-$200", "difficulty": "Easy/Medium/Hard" }
       ],
       "tools": [
         { "name": "Tool Name", "url": "..." }
       ],
       "components": [
          { "name": "Component Name", "description": "...", "url": "..." }
       ],
       "other_causes": [
         { "name": "Other Cause", "url": "..." }
       ],
       "field_note": "Technician observation (100+ words)",
       "related_diagnostics": [
         { "name": "Related Page", "url": "..." }
       ]
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
    max_tokens: 1200, // Keeps output predictable, prevents essays
  });

  const contentStr = response.choices[0].message.content;
  if (!contentStr) {
    throw new Error("Failed to generate content: empty response");
  }

  const aiData = JSON.parse(contentStr);

  // Validation Rules
    if (aiData.causes && aiData.causes.length < 3 && pageType === 'symptom') {
      console.warn('⚠️ Validation Warning: Less than 3 causes generated.');
    }
    if (aiData.repairs && aiData.repairs.length < 5 && (pageType === 'symptom' || pageType === 'cause')) {
      console.warn('⚠️ Validation Warning: Less than 5 repairs generated.');
    }
    if (!aiData.mermaid_graph && ['symptom', 'diagnostic', 'cluster'].includes(pageType)) {
      console.warn('⚠️ Validation Warning: Missing mermaid diagram.');
    }
    if (!aiData.severity_indicator && ['symptom', 'cause', 'cluster'].includes(pageType)) {
      console.warn('⚠️ Validation Warning: Missing Severity Indicator.');
    }
  if (!aiData.field_note || aiData.field_note.length < 50) {
    throw new Error("Validation failed: Missing field note");
  }

  return aiData;
}

export function renderToHtml(aiData: any): string {
  let html = '';

  // Section 2 - Problem Summary
  if (aiData.problem_summary) {
    html += `
      <div class="problem-summary mb-10">
        <h2 class="text-xl font-extrabold uppercase tracking-wide text-slate-900 border-b-2 border-slate-900 pb-2 mb-4">Problem Summary</h2>
        <div class="text-[15px] text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">${aiData.problem_summary}</div>
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
                 <span class="text-[10px] font-bold uppercase text-slate-500 tracking-widest block mb-1">Failure Mechanism</span>
                 <p class="text-[13px] text-slate-800 font-medium">${cause.mechanism || 'N/A'}</p>
               </div>
               <div>
                 <span class="text-[10px] font-bold uppercase text-slate-500 tracking-widest block mb-1">Primary Indicator</span>
                 <p class="text-[13px] text-slate-800 font-medium">${cause.indicator || 'N/A'}</p>
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

  // Section 11 - Field Technician Note
  if (aiData.field_note) {
    html += `
      <div class="field-note-panel bg-yellow-50 p-6 rounded-lg my-12 border border-yellow-300 relative overflow-hidden shadow-sm">
        <div class="absolute top-0 left-0 w-1.5 h-full bg-hvac-gold"></div>
        <h3 class="text-sm font-bold tracking-widest uppercase text-yellow-900 mb-2 flex items-center gap-2">
           <svg class="w-4 h-4 text-hvac-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
           Field Technician Assessment
        </h3>
        <div class="text-[14px] text-yellow-900 font-medium whitespace-pre-wrap leading-relaxed">"${aiData.field_note}"</div>
      </div>
    `;
  }

  // Section 12 - Related Diagnostic Paths
  if (aiData.related_diagnostics && aiData.related_diagnostics.length > 0) {
    html += `<div class="related-section my-12 pb-8">
      <h2 class="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Related Diagnostic Vectors</h2>
      <ul class="flex flex-wrap gap-2">`;
    aiData.related_diagnostics.forEach((rel: any) => {
      html += `<li><span class="inline-block bg-slate-100 border border-slate-200 text-slate-700 text-[11px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-sm">${rel.name}</span></li>`;
    });
    html += `</ul></div>`;
  }

  return html;
}

