import * as fs from 'fs';
import * as path from 'path';

// Define the absolute paths to the markdown files relative to the project root
const CORE_V1_PATH = path.join(process.cwd(), 'docs', 'DECISIONGRID-MASTER-PROMPT-V1.md');
const AUTHORITY_JSON_PATH = path.join(process.cwd(), 'docs', 'DECISIONGRID-MASTER-DIAGNOSTIC-AUTHORITY-PAGE-PROMPT.md');

/**
 * Builds the comprehensive system instruction string by combining the strict 
 * Unified Core V1 rules and the specific Authority Symptom JSON structure.
 */
export function buildAuthoritySystemPreamble(): string {
  if (!fs.existsSync(CORE_V1_PATH)) {
    throw new Error(`Core Master Prompt missing at: ${CORE_V1_PATH}`);
  }
  if (!fs.existsSync(AUTHORITY_JSON_PATH)) {
    throw new Error(`Authority JSON Prompt missing at: ${AUTHORITY_JSON_PATH}`);
  }

  const coreText = fs.readFileSync(CORE_V1_PATH, 'utf-8');
  const authorityText = fs.readFileSync(AUTHORITY_JSON_PATH, 'utf-8');

  // Combine them into a single massively restricted prompt:
  // First providing the semantic tone/architecture lock (core), 
  // then the JSON literal schema required for rendering.
  return `${coreText}\n\n======================================================\n\n${authorityText}`;
}
