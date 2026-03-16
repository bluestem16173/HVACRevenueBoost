/**
 * Repair page prompt — locked.
 * Use for AI generation of repair-focused procedural content.
 */

import * as fs from "fs";
import * as path from "path";

const PROMPT_PATH = path.join(process.cwd(), "prompts", "repair-page-prompt.md");

export function getRepairPrompt(): string {
  return fs.readFileSync(PROMPT_PATH, "utf-8");
}

export const prompt = getRepairPrompt;
