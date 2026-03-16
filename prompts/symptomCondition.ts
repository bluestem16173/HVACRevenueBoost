/**
 * Symptom-condition page prompt — locked.
 * Use for AI generation of symptom + condition diagnostic content.
 */

import * as fs from "fs";
import * as path from "path";

const PROMPT_PATH = path.join(process.cwd(), "prompts", "symptom-condition-page-prompt.md");

export function getSymptomConditionPrompt(): string {
  return fs.readFileSync(PROMPT_PATH, "utf-8");
}

export const prompt = getSymptomConditionPrompt;
