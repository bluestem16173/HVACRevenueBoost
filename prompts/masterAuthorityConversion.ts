/**
 * Master Authority + Conversion prompt — homeowner-facing diagnostic voice.
 * @see prompts/master-authority-conversion-prompt.md
 */

import * as fs from "fs";
import * as path from "path";

const PROMPT_PATH = path.join(process.cwd(), "prompts", "master-authority-conversion-prompt.md");

let cached: string | null = null;

export function getMasterAuthorityConversionPrompt(): string {
  if (cached === null) {
    cached = fs.readFileSync(PROMPT_PATH, "utf-8");
  }
  return cached;
}
