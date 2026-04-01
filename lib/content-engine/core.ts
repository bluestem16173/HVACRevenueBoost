import { createHash } from 'node:crypto';
import { Schema, GeneratedContent } from './schema';
import { validatePage } from '../validators/page-validator';

export const ENGINE_VERSION = "v4.0";

export const MASTER_GOLD_STANDARD_PROMPT = `
You are generating a GOLD STANDARD authority diagnostic page.

This page must be:
- materially better than top 3 Google results
- written like an expert technician + conversion strategist
- deeply structured, NOT generic
- designed to solve the problem AND drive action

DO NOT produce thin content.
DO NOT repeat generic advice.
DO NOT write filler.

Every section must add NEW value, specificity, or clarity.

🧱 REQUIRED PAGE STRUCTURE (EXPANDED)

1. HERO (HIGH-IMPACT, NON-GENERIC)
Clear problem statement, immediate instruction (if urgent), and confidence-building tone. Include "Do this first", "Avoid this mistake", and expectation setting.

2. QUICK ANSWER (FEATURED SNIPPET BAIT)
3–5 bullet points. Direct, actionable, no fluff.

3. DIAGNOSTIC FLOW (CORE DIFFERENTIATOR)
Step-by-step logic. Yes/No branching mindset. Each step must isolate the cause and lead to the next action. This is NOT optional — this is your edge.

4. ROOT CAUSES (DEEP, NOT GENERIC)
For EACH cause: what it is, why it happens, how to confirm it, severity (low / medium / high), and likelihood (common / uncommon). Minimum: 5 causes. Must NOT overlap or feel repetitive.

5. FIXES (ACTIONABLE + SPECIFIC)
For EACH fix: exact steps, tools required, difficulty level, time estimate, and when NOT to DIY. No vague advice like "check the system".

6. COST BREAKDOWN (MONEY SECTION)
Repair cost ranges, DIY vs professional cost comparison, what affects the price, and when the cost spikes. This increases conversion heavily.

7. PREVENTION (AUTHORITY LAYER)
How to avoid the issue long-term, specific maintenance habits, and system upgrades. Builds trust + expertise.

8. WARNING SIGNS (EARLY DETECTION)
Symptoms before failure, what users typically miss, and escalation patterns.

9. CTA (AGGRESSIVE BUT NATURAL)
Include "Get help now", "Talk to a local expert", and natural urgency if applicable. Must appear after diagnostic, after fixes, and at the bottom.

10. INTERNAL LINKS (GRAPH BUILDER)
Must include related symptoms, related system pages, and related authority guides to strengthen the SEO network.

11. FAQ (LONG-TAIL SEO)
4–6 questions using real user phrasing with concise answers.

🔥 CRITICAL DEPTH RULES:
- Each section must contain at least 2–4 paragraphs OR structured bullet logic.
- Avoid repeating the same explanation across sections.
- Each cause must feel distinct and testable.
- Each fix must include real-world execution detail.
- Use specific terminology (evaporator coil, capacitor, airflow restriction, etc.).
- Avoid generic phrases like "this could be caused by several factors".

⚡ MONETIZATION LAYER (VERY IMPORTANT):
- Include clear moments where the user realizes they need help.
- Highlight the risk of doing nothing.
- Highlight the risk of incorrect DIY.
- Introduce professional help naturally.
- Reinforce urgency for high-severity issues.

🧠 OUTPUT QUALITY FILTER:
Before finalizing, ensure:
- This page would outperform existing Google results.
- A real technician would not find this "basic".
- A user could actually solve or diagnose their issue from this page alone.
- The page builds confidence AND drives action.

-----------------------------------
OUTPUT FORMAT (STRICT JSON)
-----------------------------------

{
  "slug": "string",
  "page_type": "diagnostic",
  "title": "string",
  "relationships": { "system": [], "symptoms": [], "diagnostics": [], "causes": [], "repairs": [] },
  "content": {
    "hero": {
      "problemStatement": "...",
      "immediateInstruction": "...",
      "expectationSetting": "..."
    },
    "quickAnswer": [
      "...", "..."
    ],
    "diagnosticFlow": [
      {
        "step": "...",
        "logic": "...",
        "nextAction": "..."
      }
    ],
    "causes": [
      {
        "whatItIs": "...",
        "whyItHappens": "...",
        "howToConfirm": "...",
        "severity": "low|medium|high",
        "likelihood": "common|uncommon"
      }
    ],
    "fixes": [
      {
        "fixName": "...",
        "exactSteps": ["...", "..."],
        "toolsRequired": ["...", "..."],
        "difficultyLevel": "...",
        "timeEstimate": "...",
        "whenNotToDiy": "..."
      }
    ],
    "costBreakdown": {
      "repairCostRanges": "...",
      "diyVsProfessional": "...",
      "whatAffectsPrice": "...",
      "whenCostSpikes": "..."
    },
    "prevention": {
      "howToAvoidLongTerm": "...",
      "maintenanceHabits": ["...", "..."],
      "systemUpgrades": "..."
    },
    "warningSigns": {
      "symptomsBeforeFailure": ["...", "..."],
      "whatUsersMiss": "...",
      "escalationPatterns": "..."
    },
    "cta": {
      "primary": "...",
      "secondary": "...",
      "urgency": "..."
    },
    "internalLinks": ["...", "..."],
    "faq": [
      {
        "question": "...",
        "answer": "..."
      }
    ]
  }
}

Return ONLY valid JSON. No commentary.
`.trim();

export const EXPECTED_PROMPT_HASH = createHash('sha256')
  .update(MASTER_GOLD_STANDARD_PROMPT, 'utf8')
  .digest('hex');

export function validateContent(data: unknown, pageType: string = "diagnostic") {
  const result = validatePage(data);
  return {
    success: result.valid,
    error: result.error ? { flatten: () => result.errors } : null,
    data: data
  };
}
