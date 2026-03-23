export const BASE_MASTER_PROMPT = `
You are generating a GOLD STANDARD content page for a structured authority website.

This is not generic SEO content.
This is a high-trust, high-clarity, educational page designed to rank, help users solve a problem, and support conversion.

Your output must be:
- educational
- easy to scan
- technically credible
- specific, not generic
- aligned to search intent
- supportive of E-E-A-T
- conversion-aware without sounding like an ad

PRIMARY OBJECTIVES
1. Answer the user’s intent quickly
2. Explain the topic clearly
3. Provide expert-level observations in simple language
4. Help the user decide what to do next
5. Preserve structured data required by the frontend
6. Avoid thin content, filler, and generic repetition

UNIVERSAL CONTENT RULES
- teach something real
- include at least one expert observation or technical observation section
- avoid vague generic advice
- avoid keyword stuffing
- avoid repetitive intros/conclusions
- use concise paragraphs
- support fast scanning on mobile
- feel trustworthy and useful

E-E-A-T RULES
- show practical real-world patterns, failure modes, and observable signs
- explain accurate system behavior or issue logic
- organize content into diagnostic or decision structure where relevant
- be honest about limitations and safe DIY boundaries

Do not fake credentials.
Show expertise through clarity, specificity, and correct reasoning.

LENGTH TARGET
Target approximately 1400–1800 words unless the page intent is naturally narrower.
Prefer dense usefulness over bloated length.

STRUCTURED OUTPUT RULE
Return content in the exact schema required by the calling page type.
Do not omit required fields.
Do not return placeholders.
Do not leave arrays empty when they should be populated.
Preserve all rich data needed by the UI.

HARD FAIL CONDITIONS
Reject your own output if:
- it sounds generic
- it is thin
- it lacks expert insight
- it lacks structure
- it repeats itself
- it fails to teach
- it omits required fields
- it relies on fluff to reach length

Return only the requested structured output.
No commentary.
`.trim();

export const PAGE_TYPE_INSTRUCTIONS: Record<string, string> = {
  system: `
SYSTEM PAGE GOAL
- explain how the system works
- show major components
- show common failure points
- orient the user before diagnosis

Must include:
- system overview
- component breakdown
- operating sequence
- common failure patterns
- expert observation
- next-step internal pathways
`.trim(),

  symptom: `
SYMPTOM PAGE GOAL
- explain what a symptom usually means
- separate obvious from hidden causes
- help user narrow the issue

Must include:
- what the symptom means
- common causes ranked by likelihood
- simple user checks
- danger or escalation signs
- expert observation
- next action guidance
`.trim(),

  diagnostic: `
DIAGNOSTIC PAGE GOAL
- guide a user step-by-step toward the most likely cause

Must include:
- decision logic
- structured flow
- likely causes
- repair/action matrix
- expert observation
- when to stop DIY

CRITICAL DIAGNOSTIC FIELDS
Return and fully populate:
- decision_tree
- system_explanation
- tech_observation
- diagnostic_flow
- top_causes
- repair_matrix
- quick_tools

decision_tree must be valid Mermaid syntax.
system_explanation should contain 4–6 concise, specific steps.
`.trim(),

  cause: `
CAUSE PAGE GOAL
- deeply explain one specific root cause

Must include:
- what this cause is
- why it happens
- symptoms it creates
- how to confirm it
- how it is fixed
- expert observation
- prevention guidance
`.trim(),

  repair: `
REPAIR PAGE GOAL
- explain the repair path clearly and honestly

Must include:
- what the repair addresses
- signs this repair is relevant
- repair difficulty
- tools/materials
- cost expectations
- risks/mistakes
- expert observation
- when professional service is better
`.trim(),

  component: `
COMPONENT PAGE GOAL
- explain the component’s function, failure signs, and diagnostic role

Must include:
- what the component does
- how it fits into the system
- common failures
- symptoms of failure
- testing/inspection overview
- replacement considerations
- expert observation
`.trim(),

  condition: `
CONDITION PAGE GOAL
- explain a broader operating condition or pattern

Must include:
- what the condition means
- why it develops
- associated symptoms
- common related causes
- action guidance
- expert observation
`.trim(),

  authority: `
AUTHORITY PAGE GOAL
- teach foundational understanding and build trust

Must include:
- conceptual explanation
- key subtopics
- misconceptions
- practical implications
- expert observation
- recommended next pages
`.trim(),

  city: `
CITY PAGE GOAL
- connect issue intent with local service action

Must include:
- localized framing without spam
- issue/service explanation
- realistic local relevance
- urgency guidance where appropriate
- trust-building explanation
- conversion pathway

Do not make local pages thin, duplicated, or spun.
They must still teach something useful.
`.trim(),
};

export function buildMasterPrompt(pageType: string): string {
  const typePrompt = PAGE_TYPE_INSTRUCTIONS[pageType] ?? "";
  return [BASE_MASTER_PROMPT, typePrompt].filter(Boolean).join("\\n\\n");
}

export function buildRetryPromptFragment(reasons: string[]): string {
  return [
    "Your previous output failed quality validation.",
    "",
    "You must revise the page to correct these issues:",
    ...reasons.map((r) => "- " + r),
    "",
    "Requirements for revision:",
    "- strengthen specificity",
    "- improve educational value",
    "- add expert-level insight in plain language",
    "- remove generic filler",
    "- preserve schema exactly",
    "- keep content scannable and conversion-aware",
    "- ensure page matches intent precisely",
    "",
    "Return only corrected structured output."
  ].join("\\n");
}

export type ComposePromptOptions = {
  validationMode?: boolean;
};

export function composePromptForPageType(pageType: string, slug: string, opts?: ComposePromptOptions): string {
  return buildMasterPrompt(pageType);
}

// Keep export types and stubs required by backwards compatibility
export function validateCoreForPageType(pageType: string, data: any): { valid: boolean; errors: string[] } {
  return { valid: true, errors: [] };
}
export type SchemaDef = any; 
export type PromptSchemaResult = any;
export const VALIDATION_PROMPT = "";
