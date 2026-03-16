/**
 * Location hub page prompt — locked.
 * Use for AI generation of local service and diagnostic hub content.
 */

import * as fs from "fs";
import * as path from "path";

const PROMPT_PATH = path.join(process.cwd(), "prompts", "location-hub-page-prompt.md");

export function getLocationHubPrompt(): string {
  return fs.readFileSync(PROMPT_PATH, "utf-8");
}

export const prompt = getLocationHubPrompt;
