/**
 * System page prompt — locked.
 * Use for AI generation of pillar-level system authority content.
 */

import * as fs from "fs";
import * as path from "path";

const PROMPT_PATH = path.join(process.cwd(), "prompts", "system-page-prompt.md");

export function getSystemPrompt(): string {
  return fs.readFileSync(PROMPT_PATH, "utf-8");
}

export const prompt = getSystemPrompt;
