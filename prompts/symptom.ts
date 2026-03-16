/**
 * Symptom page prompt — locked.
 * Use for AI generation of symptom-focused diagnostic content.
 */

import * as fs from "fs";
import * as path from "path";

const PROMPT_PATH = path.join(process.cwd(), "prompts", "symptom-page-prompt.md");

export function getSymptomPrompt(): string {
  return fs.readFileSync(PROMPT_PATH, "utf-8");
}

export const prompt = getSymptomPrompt;
