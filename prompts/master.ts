/**
 * Master System Prompt — injected into every page generator.
 * Hierarchical: Master + Page-Type Prompt + Context → JSON Output
 */

import * as fs from "fs";
import * as path from "path";

const MASTER_PATH = path.join(process.cwd(), "prompts", "master-system-prompt.md");

export function getMasterSystemPrompt(): string {
  return fs.readFileSync(MASTER_PATH, "utf-8");
}
