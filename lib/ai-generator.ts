import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const MASTER_PROMPT = `
DecisionGrid / HVAC Revenue Boost
Authority Diagnostic Architecture Upgrade

You are upgrading the DecisionGrid HVAC diagnostic system to operate as a technical knowledge graph and service manual, not a blog.
The goal is to support 10,000–300,000 programmatic pages while maintaining high technical authority, strong SEO architecture, and high lead conversion.
All pages must behave like engineering documentation and diagnostic reference manuals.

Core Knowledge Graph Structure
The system contains the following entities: systems, problem clusters, symptoms, conditions, causes, repairs, components, tools, cities, environments.
Each entity must generate its own dedicated page type and connect through internal links.
Take note: Conditions (e.g., fan running) represent mechanical states and are distinct from Environments (e.g., extreme heat), which represent external modifiers.
The true logical flow is: System -> Problem Cluster -> Symptom -> Condition -> Environment Modifier -> Cause -> Repair -> Component

Page Types Required
Generate the following page categories: System Pages, Cluster Pages, Symptom Pages, Condition Pages, Cause Pages, Repair Pages, Component Pages, Tool Pages, City Pages, Authority Hub Pages.
Each page must link to other related entities.

THE SEO TRICK: AUTHORITY HUB PAGES
Implement Authority Hub Pages that organize the entire knowledge graph.
These pages improve: crawlability, internal linking density, topical authority, indexation speed.
Required Hub Pages: /hvac-symptoms, /hvac-causes, /hvac-repairs, /hvac-components, /hvac-tools, /hvac-diagnostics.
For Hub Pages, output a structured directory format linking to the respective symptom, cause, repair, etc.

System Page Structure (Pillar Pages)
Example: /hvac, /rv-hvac, /home-hvac
Structure: System Overview, How the System Works, Component Map, Common Symptoms, Diagnostic Procedures, Common Repairs.

Symptom Page Layout
Structure must follow this exact narrative flow:
- H1 Symptom Title
- System Context
- Field Note
- Mermaid Diagnostic Flow
- Common Causes
- Diagnostic Confidence Box (including Problem Severity Indicator)
- Possible Fixes
- Repair Cost Table
- Tools for DIY Repair
- Other Causes of [Primary Symptom]
- Component References
- Related Diagnostic Pages

Replace "Narrow Your Diagnosis"
Do NOT narrow to a single diagnosis. Instead show: Other Causes of [Primary Symptom]. Must link internally.

Interactive Diagnostic Tree
Keep the interactive tree but remove one-sentence tooltips. Clicking a node must open a technical diagnostic panel containing the Field Note, Causes, and Fixes.

Diagnostic Panel Requirements
- Field Note: Technician-style observation. 80-120 words. Technical tone, service manual language.
- Common Causes: Minimum 3 causes. Minimum 60 words per cause. Must include failure mechanism, diagnostic indicator, technical explanation.
- Diagnostic Confidence Box: MUST INCLUDE a "Problem Severity Indicator" above the confidence metrics. The Severity Indicator captures "Severity", "Risk if ignored", and "Estimated failure window".
- Possible Fixes: Minimum 5 repair options mapped to causes. 40-60 words explanation.
- Repair Cost Table: Transparency with Cost and Difficulty.
- Tools for DIY: List tools linking to tool pages/Amazon.

Mermaid Diagnostic Flow
Every symptom page must include a Mermaid diagnostic flowchart.
Rules: Start node must be page symptom, minimum 7 nodes, must represent realistic diagnostic logic. ALWAYS use \`graph TD\` or valid Mermaid. No HTML in flow.

Component References Section
List related HVAC components. Each links to component pages.

Conversion Architecture Improvement: Lead Capture Diagnostic Trigger
Add lead capture triggers at 40% scroll, diagnostic tree interaction, and repair table interaction.
The lead capture modal must use Progressive Steps for higher completion rates: ZIP -> System Type -> Phone (do not ask for all at once).

City Page URL Structure (Hierarchical Location Routing)
City pages must use a structured path format: /hvac-repair/[city]/[symptom-slug] (e.g., /hvac-repair/tampa/ac-not-cooling).

DecisionGrid Homepage Architecture
Maintain the card-based homepage navigation for knowledge graph categories (Systems, Problems, Repairs, Parts, Diagnostics). Do not expose every entity.

Internal Link Architecture
All pages must link across entities to create a dense knowledge graph.

Content Tone Requirements
Content must read like: HVAC technician service manual, technical documentation, engineering reference.
Avoid: blog tone, marketing language, generic advice, one sentence explanations.

Generator Validation Rules
Reject page generation if: less than 3 causes, less than 5 repair options, missing mermaid diagram, missing field note.

Critical Goal
This architecture must scale to 10k/100k/300k pages while maintaining technical authority and strong lead generation.
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
       "field_note": "Technician observation (80-120 words)",
       "cluster_category": "Optional. Only if this is a symptom or cause page, list the parent cluster",
       "severity_indicator": {
          "severity": "Low/Moderate/High/Critical",
          "risk_if_ignored": "Brief explanation",
          "estimated_failure_window": "Timeframe"
       },
       "mermaid_graph": "graph TD\\n...",
       "causes": [
         { "name": "Cause Name", "mechanism": "...", "indicator": "...", "explanation": "..." }
       ],
       "repairs": [
         { "name": "Repair Name", "explanation": "...", "cost": "$100-$200", "difficulty": "Easy/Medium/Hard" }
       ],
       "tools": [
         { "name": "Tool Name", "url": "..." }
       ],
       "other_causes": [
         { "name": "Other Cause", "url": "..." }
       ],
       "component_references": [
         { "name": "Component Name", "url": "..." }
       ],
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
  let html = `<div class="system-context prose max-w-none">
    ${aiData.content ? `<p>${aiData.content}</p>` : ''}
  </div>`;

  // 1. Field Note
  if (aiData.field_note) {
    html += `
      <div class="field-note-panel bg-neutral-100 p-6 rounded-lg mb-8 border-l-4 border-amber-500">
        <h3 class="text-xl font-bold mb-2">Technician Field Note</h3>
        <p class="text-gray-700 font-medium italic">"${aiData.field_note}"</p>
      </div>
    `;
  }

  // 2. Common Causes
  if (aiData.causes && aiData.causes.length > 0) {
    html += `<div class="diagnostic-causes mb-12">`;
    html += `<h2 class="text-2xl font-bold mb-6">Common Causes</h2>`;
    html += `<ul class="space-y-6">`;
    aiData.causes.forEach((cause: any) => {
      html += `
        <li class="bg-white p-6 shadow rounded-lg">
          <h3 class="font-bold text-lg mb-2 text-blue-800">${cause.name}</h3>
          <p class="text-sm font-semibold text-gray-600 mb-1">Mechanism: <span class="text-gray-800 font-normal">${cause.mechanism || 'N/A'}</span></p>
          <p class="text-sm font-semibold text-gray-600 mb-2">Indicator: <span class="text-gray-800 font-normal">${cause.indicator || 'N/A'}</span></p>
          <p class="text-gray-700">${cause.explanation || ''}</p>
        </li>
      `;
    });
    html += `</ul></div>`;
  }

  // 3. Diagnostic Confidence Box
  if (aiData.severity_indicator || (aiData.causes && aiData.causes.length > 0)) {
    const primaryCause = aiData.causes && aiData.causes.length > 0 ? aiData.causes[0].name : 'Requires Diagnostic Tree Navigation';
    html += `
      <div class="confidence-box bg-blue-50 border border-blue-200 p-6 rounded-xl mb-12 relative overflow-hidden">
        <div class="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
        <h2 class="text-xl font-bold mb-6 text-gray-900 border-b pb-2">Diagnostic Confidence Box</h2>
    `;
    
    if (aiData.severity_indicator) {
      const sevColor = aiData.severity_indicator.severity.toLowerCase().includes('critical') ? 'text-red-700 bg-red-100' : 'text-amber-700 bg-amber-100';
      html += `
        <div class="severity-indicator mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
           <div class="flex items-center gap-2 mb-2">
             <span class="font-bold">Problem Severity:</span> 
             <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${sevColor}">${aiData.severity_indicator.severity}</span>
           </div>
           <p class="text-sm text-gray-700 mb-1"><span class="font-semibold">Risk if ignored:</span> ${aiData.severity_indicator.risk_if_ignored}</p>
           <p class="text-sm text-gray-700"><span class="font-semibold">Estimated failure window:</span> ${aiData.severity_indicator.estimated_failure_window}</p>
        </div>
      `;
    }

    html += `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div class="bg-white p-4 rounded shadow-sm">
            <span class="text-sm text-gray-500 uppercase font-bold tracking-wider">Likely Diagnosis</span>
            <p class="text-lg font-bold text-gray-900 mt-1">${primaryCause}</p>
          </div>
          <div class="bg-white p-4 rounded shadow-sm">
            <span class="text-sm text-gray-500 uppercase font-bold tracking-wider">Confidence Level</span>
            <p class="text-lg font-bold text-green-700 mt-1">75 - 85%</p>
          </div>
          <div class="bg-white p-4 rounded shadow-sm">
            <span class="text-sm text-gray-500 uppercase font-bold tracking-wider">Action</span>
            <p class="text-lg font-bold text-blue-700 mt-1">View Repair Table ↓</p>
          </div>
        </div>
        
        <div class="flex flex-wrap gap-4 mt-6">
           <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">Get Local Technician Quote</button>
           <button class="bg-white hover:bg-gray-50 text-blue-800 border border-blue-200 font-bold py-3 px-6 rounded-lg transition-colors">Check Parts Cost</button>
        </div>
      </div>
    `;
  }

  // 5. Possible Fixes & Cost Table
  if (aiData.repairs && aiData.repairs.length > 0) {
    html += `<div class="repairs-section my-8">
      <h2 class="text-2xl font-bold mb-4">Possible Fixes & Cost</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white border border-gray-200">
          <thead class="bg-gray-100">
            <tr>
              <th class="py-2 px-4 border-b text-left">Repair</th>
              <th class="py-2 px-4 border-b text-left">Description</th>
              <th class="py-2 px-4 border-b text-left">Estimated Cost</th>
              <th class="py-2 px-4 border-b text-left">Difficulty</th>
            </tr>
          </thead>
          <tbody>`;
    
    aiData.repairs.forEach((repair: any) => {
      html += `<tr>
        <td class="py-2 px-4 border-b"><a href="${repair.slug || '#'}" class="text-blue-600 hover:underline">${repair.name}</a></td>
        <td class="py-2 px-4 border-b">${repair.explanation}</td>
        <td class="py-2 px-4 border-b">${repair.cost || repair.estimated_cost || 'N/A'}</td>
        <td class="py-2 px-4 border-b">${repair.difficulty}</td>
      </tr>`;
    });
    
    html += `</tbody></table></div></div>`;
  }

  if (aiData.tools && aiData.tools.length > 0) {
    html += `<div class="tools-section my-8">
      <h2 class="text-2xl font-bold mb-4">Tools for DIY Repair</h2>
      <ul class="list-disc pl-6">`;
    aiData.tools.forEach((tool: any) => {
      html += `<li><a href="${tool.url || '#'}" class="text-blue-600 hover:underline">${tool.name}</a></li>`;
    });
    html += `</ul></div>`;
  }

  if (aiData.other_causes && aiData.other_causes.length > 0) {
    html += `<div class="other-causes-section my-8">
      <h2 class="text-2xl font-bold mb-4">Other Causes</h2>
      <ul class="list-disc pl-6">`;
    aiData.other_causes.forEach((cause: any) => {
      html += `<li><a href="${cause.url || '#'}" class="text-blue-600 hover:underline">${cause.name}</a></li>`;
    });
    html += `</ul></div>`;
  }

  if (aiData.components && aiData.components.length > 0) {
    html += `<div class="components-section my-8">
      <h2 class="text-2xl font-bold mb-4">Component References</h2>
      <ul class="list-disc pl-6">`;
    aiData.components.forEach((comp: any) => {
      html += `<li><strong><a href="${comp.url || '#'}" class="text-blue-600 hover:underline">${comp.name}</a></strong>: ${comp.description || ''}</li>`;
    });
    html += `</ul></div>`;
  }

  if (aiData.related_diagnostics && aiData.related_diagnostics.length > 0) {
    html += `<div class="related-section my-8">
      <h2 class="text-2xl font-bold mb-4">Related Diagnostic Pages</h2>
      <ul class="list-disc pl-6">`;
    aiData.related_diagnostics.forEach((rel: any) => {
      html += `<li><a href="${rel.url || '#'}" class="text-blue-600 hover:underline">${rel.name}</a></li>`;
    });
    html += `</ul></div>`;
  }

  return html;
}
