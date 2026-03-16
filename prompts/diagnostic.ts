/**
 * Diagnostic guide page prompt — locked.
 * Use for AI generation of diagnostic decision and troubleshooting content.
 */

import * as fs from "fs";
import * as path from "path";

const PROMPT_PATH = path.join(process.cwd(), "prompts", "diagnostic-guide-page-prompt.md");

export function getDiagnosticPrompt(): string {
  return fs.readFileSync(PROMPT_PATH, "utf-8");
}

export const prompt = getDiagnosticPrompt;
