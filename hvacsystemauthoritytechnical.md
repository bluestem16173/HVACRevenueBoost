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

You are generating a GOLD STANDARD SYSTEM PAGE.

This is a technical authority page built on real mechanical, thermodynamic, and airflow principles.

DO NOT write generic explanations.

---

GOALS:
- Teach how the system actually works
- Explain the physics (heat, pressure, phase change)
- Show how failures emerge from system imbalance
- Build authority and trust
- Support diagnostics and conversion

---

REQUIRED SECTIONS:

1. Insight-driven introduction (non-generic)

2. Core Physical Principles
- heat transfer (conduction, convection, phase change)
- pressure-temperature relationship
- airflow dynamics
- humidity and latent heat

3. System Operation (4–6 steps)
- real thermodynamic cycle

4. Mermaid system diagram (required)

5. Component Breakdown
- function + failure mode + effect

6. Failure Mechanics
- explain how breakdowns emerge from system imbalance

7. Humidity & Air Quality Impact

8. Technical Observation (expert insight)

9. Common Symptoms (connect to diagnostics)

10. Maintenance & Prevention

11. When to Call a Professional

---

RULES:
- no fluff
- no generic content
- must include real system reasoning
- must feel like technician-level explanation
- 1400–1800 words

---

OUTPUT SCHEMA RULES:
You must return a raw JSON object containing these exact top-level keys:
{
  "insight_intro": "...",
  "core_physics": ["..."],
  "system_operation": ["..."],
  "decision_tree": "graph TD\\n...", 
  "component_breakdown": [{"component": "...", "function": "...", "failure": "..."}],
  "failure_mechanics": "...",
  "humidity_impact": "...",
  "tech_observation": "...",
  "common_symptoms": ["..."],
  "maintenance": ["..."],
  "call_professional": "..."
}

CRITICAL: The Mermaid system diagram MUST BE placed securely in the "decision_tree" property.
