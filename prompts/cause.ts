/**
 * Cause page prompt — locked.
 * Use for AI generation of cause-focused diagnostic content.
 */

import * as fs from "fs";
import * as path from "path";

const PROMPT_PATH = path.join(process.cwd(), "prompts", "cause-page-prompt.md");

export function getCausePrompt(): string {
  return fs.readFileSync(PROMPT_PATH, "utf-8");
}

export const prompt = getCausePrompt;
