/**
 * DecisionGrid-aligned high-conversion diagnostic master prompt.
 * @see prompts/hvac-high-conversion-decisiongrid-master.md
 */

import * as fs from "fs";
import * as path from "path";

const PROMPT_PATH = path.join(process.cwd(), "prompts", "hvac-high-conversion-decisiongrid-master.md");

let cached: string | null = null;

export function getHvacHighConversionDecisiongridMasterPrompt(): string {
  if (cached === null) {
    cached = fs.readFileSync(PROMPT_PATH, "utf-8");
  }
  return cached;
}
