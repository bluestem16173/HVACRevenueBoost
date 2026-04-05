import * as fs from "fs";
import * as path from "path";
import { DiagnosticEngineJson, diagnosticEngineJsonSchema } from "../validation/diagnosticSchema";
import { validateDiagnostic } from "../validation/validateDiagnostic";

const SYSTEM_PROMPT_PATH = path.join(process.cwd(), "..", "..", "..", "prompts", "decisiongrid-master-v2-system.md");
const USER_PROMPT_PATH = path.join(process.cwd(), "..", "..", "..", "prompts", "decisiongrid-master-v2-user.md");

export async function generateDiagnosticEngineJson(
  slug: string, 
  system: string = "", 
  extraContext: string = "", 
  includeImageMap: boolean = false,
  pageType: "diagnostic" | "authority" | "repair" = "diagnostic"
): Promise<DiagnosticEngineJson> {
  const systemInstruction = fs.readFileSync(SYSTEM_PROMPT_PATH, "utf-8");
  let userInstruction = fs.readFileSync(USER_PROMPT_PATH, "utf-8");

  let emphasisBlock = "";
  if (pageType === "authority") {
    emphasisBlock = `FOCUS EMPHASIS: AUTHORITY (BUT STILL DIAGNOSTIC FORMAT)
- deeper explanations
- more technical reasoning
- richer cause descriptions
- expanded prevention + system behavior`;
  } else if (pageType === "repair") {
    emphasisBlock = `FOCUS EMPHASIS: REPAIR (BUT STILL DIAGNOSTIC FORMAT)
- emphasize fixes
- step-by-step actions
- tools required
- difficulty + cost`;
  } else {
    emphasisBlock = `FOCUS EMPHASIS: DIAGNOSTIC
- decision flow
- ranked causes
- actionable fixes`;
  }

  // Replace placeholders in user prompt
  userInstruction = userInstruction
    .replace("{{SLUG}}", slug)
    .replace("{{PAGE_TYPE}}", pageType.toUpperCase())
    .replace("{{PAGE_EMPHASIS_BLOCK}}", emphasisBlock)
    .replace("{{SYSTEM_SLUG_OPTIONAL}}", system)
    .replace("{{OPTIONAL_TECH_NOTES}}", extraContext)
    .replace("{{true_or_false}}", String(includeImageMap));

  console.log(`[Diagnostic] Calling AI model for slug: ${slug}`);
  // In a real implementation we would call the AI model here (e.g. Gemini/OpenAI). 
  // We'll mock the JSON parsing for context completion.
  
  // const response = await callModel(systemInstruction, userInstruction);
  // const payload = extractJson(response);
  const payload: any = {}; // Placeholder

  try {
    const validated = validateDiagnostic(payload);
    return validated;
  } catch (err: any) {
    console.error(`Schema validation failed for ${slug}: ${err.message}`);
    throw new Error(`Generation failed validation: ${err.message}`);
  }
}
