import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const MASTER_PROMPT = `
HVAC Diagnostic Authority Page Layout
Writing

We are standardizing all HVAC diagnostic pages to use a professional diagnostic interface similar to DecisionGrid.

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
This panel mimics the DecisionGrid diagnostic system context. Display structured metadata: System, Component Path, Operating Mode, Symptom Category, Environment.

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
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.2, // Low temp for technical consistency
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
      <div class="problem-summary mb-8">
        <h2 class="text-2xl font-bold mb-4">Problem Summary</h2>
        <div class="prose max-w-none text-slate-700 whitespace-pre-wrap">${aiData.problem_summary}</div>
      </div>
    `;
  }

  // Section 3 - Diagnostic Overview Panel
  if (aiData.diagnostic_overview) {
    html += `
      <div class="diagnostic-overview bg-slate-50 border border-slate-200 p-6 rounded-xl mb-8">
        <h3 class="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Diagnostic Overview</h3>
        <ul class="grid sm:grid-cols-2 gap-y-2 text-sm text-slate-600">
          <li><span class="font-bold text-slate-800">System:</span> ${aiData.diagnostic_overview.system || 'N/A'}</li>
          <li><span class="font-bold text-slate-800">Operating Mode:</span> ${aiData.diagnostic_overview.operating_mode || 'N/A'}</li>
          <li><span class="font-bold text-slate-800">Path:</span> ${aiData.diagnostic_overview.component_path || 'N/A'}</li>
          <li><span class="font-bold text-slate-800">Category:</span> ${aiData.diagnostic_overview.symptom_category || 'N/A'}</li>
          <li><span class="font-bold text-slate-800">Environment:</span> ${aiData.diagnostic_overview.environment || 'N/A'}</li>
        </ul>
      </div>
    `;
  }

  // Section 4 & 5 - Confidence Box & Severity Indicator
  if (aiData.confidence_box || aiData.severity_indicator) {
     html += `
      <div class="confidence-severity-panel bg-blue-50 border border-blue-200 p-6 rounded-xl mb-12 relative overflow-hidden">
        <div class="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
        <h2 class="text-xl font-bold mb-4 text-gray-900 border-b pb-2">Diagnostic Confidence</h2>
    `;
    
    if (aiData.confidence_box) {
      html += `<p class="mb-4 text-emerald-700 font-bold uppercase tracking-wider text-sm">Confidence Level: ${aiData.confidence_box}</p>`;
    }

    if (aiData.severity_indicator) {
      const isCritical = aiData.severity_indicator.severity?.toLowerCase().includes('critical') || aiData.severity_indicator.severity?.toLowerCase().includes('high');
      const sevColor = isCritical ? 'text-red-700 bg-red-100' : 'text-amber-700 bg-amber-100';
      
      html += `
        <div class="severity-indicator p-4 bg-white rounded-lg shadow-sm border border-gray-100">
           <div class="flex items-center gap-2 mb-2">
             <span class="font-bold">Problem Severity:</span> 
             <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${sevColor}">${aiData.severity_indicator.severity}</span>
           </div>
           <p class="text-sm text-gray-700 mb-1"><span class="font-semibold">Risk if ignored:</span> ${aiData.severity_indicator.risk_if_ignored}</p>
           <p class="text-sm text-gray-700 mb-1"><span class="font-semibold">Estimated failure window:</span> ${aiData.severity_indicator.estimated_failure_window}</p>
           <p class="text-sm text-gray-700"><span class="font-semibold">Repair Urgency:</span> ${aiData.severity_indicator.repair_urgency || 'N/A'}</p>
        </div>
      `;
    }
    html += `</div>`;
  }

  // Section 7 - Common Causes
  if (aiData.causes && aiData.causes.length > 0) {
    html += `<div class="diagnostic-causes mb-12">`;
    html += `<h2 class="text-2xl font-bold mb-6">Common Causes</h2>`;
    html += `<div class="space-y-6">`;
    aiData.causes.forEach((cause: any) => {
      html += `
        <div class="bg-white p-6 shadow-sm border border-slate-200 rounded-lg">
           <h3 class="font-black text-lg mb-2 text-hvac-navy">${cause.name}</h3>
           <div class="mb-3">
             <span class="text-xs font-bold uppercase text-slate-500 tracking-wider">Failure Mechanism</span>
             <p class="text-sm text-slate-700">${cause.mechanism || 'N/A'}</p>
           </div>
           <div class="mb-3">
             <span class="text-xs font-bold uppercase text-slate-500 tracking-wider">Diagnostic Indicator</span>
             <p class="text-sm text-slate-700">${cause.indicator || 'N/A'}</p>
           </div>
           
           <div class="mt-4 pt-4 border-t border-slate-100">
              <span class="text-sm font-bold text-slate-800 block mb-2">Root Cause Analysis</span>
              <div class="text-sm text-slate-600 whitespace-pre-wrap">${cause.root_cause_analysis || ''}</div>
           </div>
           
           <div class="mt-4">
              <span class="text-sm font-bold text-slate-800 block mb-2">Technical Explanation</span>
              <div class="text-sm text-slate-600 whitespace-pre-wrap">${cause.explanation || ''}</div>
           </div>
        </div>
      `;
    });
    html += `</div></div>`;
  }

  // Section 8 - Diagnostic Tests
  if (aiData.diagnostic_tests && aiData.diagnostic_tests.length > 0) {
    html += `<div class="diagnostic-tests-section my-12">
      <h2 class="text-2xl font-bold mb-6">Diagnostic Tests</h2>
      <div class="space-y-6">`;
    
    aiData.diagnostic_tests.forEach((test: any) => {
      html += `
        <div class="bg-indigo-50/50 border border-indigo-100 p-6 rounded-lg">
          <h3 class="text-lg font-bold text-indigo-900 mb-3">${test.name}</h3>
          
          <div class="mb-4">
             <span class="text-xs font-bold uppercase tracking-wider text-indigo-500 block mb-1">Tools Required</span>
             <ul class="flex flex-wrap gap-2">
               ${(test.tools || []).map((t: string) => `<li class="bg-white border border-indigo-200 text-indigo-700 text-xs px-2 py-1 rounded shadow-sm">${t}</li>`).join('')}
             </ul>
          </div>
          
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-indigo-500 block mb-2">Procedure Steps</span>
            <ol class="list-decimal pl-5 text-sm text-slate-700 space-y-1">
              ${(test.steps || []).map((s: string) => `<li>${s}</li>`).join('')}
            </ol>
          </div>
        </div>
      `;
    });
    html += `</div></div>`;
  }

  // Section 9 - Repair Options
  if (aiData.repairs && aiData.repairs.length > 0) {
    html += `<div class="repairs-section my-12">
      <h2 class="text-2xl font-bold mb-4">Repair Options</h2>
      <div class="overflow-x-auto rounded-lg shadow-sm border border-slate-200">
        <table class="min-w-full bg-white">
          <thead class="bg-slate-50">
            <tr>
              <th class="py-3 px-4 border-b font-bold text-sm text-slate-700 text-left">Repair</th>
              <th class="py-3 px-4 border-b font-bold text-sm text-slate-700 text-left">Description</th>
              <th class="py-3 px-4 border-b font-bold text-sm text-slate-700 text-left">Estimated Cost</th>
              <th class="py-3 px-4 border-b font-bold text-sm text-slate-700 text-left">Difficulty</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">`;
    
    aiData.repairs.forEach((repair: any) => {
      html += `<tr>
        <td class="py-3 px-4 text-sm font-medium"><a href="${repair.slug || '#'}" class="text-blue-600 hover:underline">${repair.name}</a></td>
        <td class="py-3 px-4 text-sm text-slate-600 whitespace-pre-wrap">${repair.explanation}</td>
        <td class="py-3 px-4 text-sm text-slate-700 font-medium">${repair.cost || repair.estimated_cost || 'N/A'}</td>
        <td class="py-3 px-4 text-sm text-slate-600">${repair.difficulty}</td>
      </tr>`;
    });
    
    html += `</tbody></table></div></div>`;
  }

  // Section 10 - Components
  if (aiData.components && aiData.components.length > 0) {
    html += `<div class="components-section my-12">
      <h2 class="text-xl font-bold mb-4 border-b pb-2">Components & Tools</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">`;
    aiData.components.forEach((comp: any) => {
      html += `
        <a href="${comp.url || '#'}" class="bg-white border border-slate-200 hover:border-blue-400 p-4 rounded-lg shadow-sm transition group">
           <h4 class="font-bold text-sm text-slate-800 group-hover:text-blue-600">${comp.name}</h4>
           ${comp.description ? `<p class="text-xs text-slate-500 mt-1 line-clamp-2">${comp.description}</p>` : ''}
        </a>
      `;
    });
    html += `</div></div>`;
  }

  // Section 11 - Field Technician Note
  if (aiData.field_note) {
    html += `
      <div class="field-note-panel bg-amber-50 p-6 rounded-lg my-12 border border-amber-200 relative overflow-hidden">
        <div class="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
        <h3 class="text-lg font-black tracking-wide uppercase text-amber-800 mb-3 flex items-center gap-2">
           <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
           Field Technician Note
        </h3>
        <div class="text-amber-900 font-medium whitespace-pre-wrap leading-relaxed">"${aiData.field_note}"</div>
      </div>
    `;
  }

  // Section 12 - Related Diagnostic Paths
  if (aiData.related_diagnostics && aiData.related_diagnostics.length > 0) {
    html += `<div class="related-section my-12">
      <h2 class="text-xl font-bold mb-4 border-b pb-2">Related Diagnostic Paths</h2>
      <ul class="flex flex-wrap gap-2">`;
    aiData.related_diagnostics.forEach((rel: any) => {
      html += `<li><a href="${rel.url || '#'}" class="inline-block bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-full transition">${rel.name}</a></li>`;
    });
    html += `</ul></div>`;
  }

  return html;
}

