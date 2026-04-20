/**
 * Verbatim HVAC strings enforced by {@link validatePage} / {@link assertHardAuthority}.
 * Single source of truth for injection + validation (no drift).
 *
 * **Compiler tokens:** these are not “marketing copy” — the validator does a literal (lowercased)
 * substring match. Model paraphrases fail; {@link injectRequiredHvacCompilerTokens} appends missing
 * tokens before `validatePage` so scale does not depend on LLM luck.
 */

/** Unique anchor inside {@link HVAC_VERBATIM_DECISION_PARAGRAPH} (docs / grep / pre-scan). */
export const HVAC_COMPILER_TOKEN_DECISION_ANCHOR = "fault is no longer superficial";

/** Full decision paragraph — must match `validatePage` byte-for-byte after lowercasing. */
export const HVAC_VERBATIM_DECISION_PARAGRAPH =
  "if airflow, thermostat, and power are confirmed and the system still is not cooling, the fault is no longer superficial. continuing to run the system is what turns a manageable repair into a major failure";

/**
 * Unique anchor inside {@link HVAC_VERBATIM_COST_PRESSURE}. {@link injectRequiredHvacCompilerTokens} uses it to
 * replace the containing sentence when the model paraphrased, or to append the full line when absent.
 * `validatePage` still requires the full {@link HVAC_VERBATIM_COST_PRESSURE} substring.
 */
export const HVAC_COMPILER_TOKEN_COST_ANCHOR = "multi-thousand-dollar failure";

export const HVAC_VERBATIM_COST_PRESSURE =
  "what starts as a minor repair can become a multi-thousand-dollar failure when the system continues running under fault";

export const HVAC_VERBATIM_COMPRESSOR_LINE =
  "this is how minor complaints turn into compressor failures";

/** Ensures both `fan running` and `system working` appear in narrative fields for the gate. */
export const HVAC_VERBATIM_FAN_SYSTEM_CONTRAST =
  "When the fan running is steady but the system working outcome fails, that contrast is the first branch.";

/** `replace_vs_repair` must mention age — shared by {@link assertHardAuthority} and {@link assertHvacPreflight}. */
export const HVAC_REPLACE_VS_REPAIR_AGE_THRESHOLD_RE =
  /(older than|over \d+ ?years|age of system)/i;
