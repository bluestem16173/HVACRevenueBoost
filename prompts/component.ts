/**
 * Component page prompt — locked.
 * Use for AI generation of component-focused technical content.
 */

import * as fs from "fs";
import * as path from "path";

const PROMPT_PATH = path.join(process.cwd(), "prompts", "component-page-prompt.md");

export function getComponentPrompt(): string {
  return fs.readFileSync(PROMPT_PATH, "utf-8");
}

export const prompt = getComponentPrompt;
