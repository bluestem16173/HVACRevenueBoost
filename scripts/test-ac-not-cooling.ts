import OpenAI from "openai";
import sql from "../lib/db";
import { contentToHtml } from "../lib/contentToHtml";

const openai = new OpenAI();
const slug = "ac-not-cooling";

const TEST_PROMPT = `You are an HVAC diagnostic expert and SEO content strategist.

TASK:
Generate a complete structured page payload for:

SLUG: {slug}
PAGE_TYPE: symptom

GOALS:
- Clean, structured JSON output
- High-quality diagnostic content
- Natural internal linking
- Monetization-ready (components + tools)
- Readable and concise

CRITICAL RULES:
- Output JSON only
- No markdown
- No explanations
- No escape characters like \\n
- Keep all fields short (1–2 sentences)
- Include all required fields even if minimal
- Avoid repetition
- Use natural language

CONTENT REQUIREMENTS:

1. title (capitalized)
2. quick_answer (1–2 sentences)
3. short_explanation (2–3 sentences, readable)
4. systems (4 systems: Electrical, Mechanical, Chemical, Structural)
   - each system: max 2 issues
   - each issue:
     - cause
     - signs
     - check
     - fix
     - difficulty
     - pro_required

5. top_causes (3 distinct causes)
6. when_to_call_pro (1–2 sentences)

7. seo_links (internal linking object)

SYSTEM EXPLANATION (REQUIRED)
- Provide exactly 4 bullet points explaining the system
- Each bullet = 1–2 sentences max
- Must follow flow:
  1. Thermostat trigger
  2. Indoor heat absorption (evaporator)
  3. Outdoor heat release (condenser)
  4. Refrigerant cycle continuity

=== NARROW DOWN THE PROBLEM (REQUIRED) ===

You MUST generate 3 diagnostic categories:

1. ENVIRONMENTS (3–5 items)
These describe external conditions:
Examples:
- High outdoor temperature
- High humidity
- After long runtime
- During peak afternoon heat

Return as:
"environments": [string, string, string]


2. DIAGNOSTIC CONDITIONS (3–5 items)
These describe system behavior:
Examples:
- Air is warm instead of cold
- System cycles frequently
- Weak airflow from vents
- Cooling is inconsistent

Return as:
"conditions": [string, string, string]


3. SYSTEM NOISES (2–4 items)
Examples:
- Clicking sound
- Buzzing noise
- Hissing near unit
- No unusual noise

Return as:
"noises": [string, string]

TECHNICIAN OBSERVATION (REQUIRED)
- 2–3 sentences
- Written in real HVAC technician tone
- Must include: real-world scenario, diagnostic hint, caution or insight

MECHANICAL FIELD NOTE (REQUIRED)
- 50–75 words
- Must explain how compressor, coils, or thermostat failures lead to the issue.
- Must include a field note tip.

REPAIR DIFFICULTY MATRIX (REQUIRED)
For EACH system: Electrical, Mechanical, Structural, Chemical
Provide EXACTLY 3 repairs per system:
- Ordered from least expensive → most expensive
- Each must include: name, difficulty (easy|medium|hard), estimated_cost_range, short_description (1 sentence)

LINK RULES:
- 3 related symptoms
- 2 related causes
- 2 related repairs
- 2 related components
- anchors must be natural phrases (not slug copy)
- anchors must read well inside a sentence

PATH RULES:
- symptoms → /conditions/{slug}
- causes → /causes/{slug}
- repairs → /repairs/{slug}
- components → /components/{slug}

OUTPUT FORMAT:

{
  "title": "",
  "quick_answer": "",
  "short_explanation": "",
  "systems": [],
  "top_causes": [],
  "when_to_call_pro": "",
  "system_explanation": ["", "", "", ""],
  "conditions": ["", "", ""],
  "environments": ["", "", ""],
  "noises": ["", "", ""],
  "tech_observation": "",
  "mechanical_field_note": "",
  "repair_matrix": {
    "electrical": [
      {
        "name": "",
        "difficulty": "easy|medium|hard",
        "estimated_cost_range": "",
        "short_description": ""
      }
    ],
    "mechanical": [],
    "structural": [],
    "chemical": []
  },
  "seo_links": {
    "related_symptoms": [],
    "related_causes": [],
    "related_repairs": [],
    "related_components": []
  }
}`;

async function run() {
  console.log("Generating payload for ac-not-cooling...");
  const msg = TEST_PROMPT.replace("{slug}", slug);

  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "user", content: msg }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3
  });

  const content = res.choices[0]?.message?.content;
  if (!content) throw new Error("No output");
  
  const data = JSON.parse(content);
  
  console.log({
    system_explanation: data.system_explanation?.length,
    conditions: data.conditions?.length,
    environment: data.environment?.length,
    noises: data.noises?.length,
    repair_matrix: {
      electrical: data.repair_matrix?.electrical?.length,
      mechanical: data.repair_matrix?.mechanical?.length,
      structural: data.repair_matrix?.structural?.length,
      chemical: data.repair_matrix?.chemical?.length
    }
  });

  console.log("Got data top-level keys:", Object.keys(data));

  const seoLinks = data.seo_links;
  console.log("Got seo_links structured as:", Object.keys(seoLinks || {}));

  const html = contentToHtml(data);

  const dbSlug = `conditions/${slug}`;
  // Save to DB mimicking production
  await sql`
    INSERT INTO pages (slug, title, page_type, content_json, content_html, status, quality_score, updated_at)
    VALUES (${dbSlug}, ${data.title || slug}, 'symptom', ${data}, ${html}, 'published', 100, NOW())
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      content_json = EXCLUDED.content_json,
      content_html = EXCLUDED.content_html,
      status = 'published',
      quality_score = 100,
      updated_at = NOW()
  `;

  console.log("✅ Success! Run 'npm run dev' and visit http://localhost:3000/diagnose/ac-not-cooling to view");
  process.exit(0);
}

run().catch(console.error);
