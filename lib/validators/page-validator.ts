export type ValidationResult = {
  valid: boolean;
  errors?: string[]; 
  error?: string;    
};

export function validatePage(page: any): ValidationResult {
  if (!page) return { valid: false, error: "Empty payload", errors: ["Empty payload"] };

  try {
    // HARD FAIL CONDITIONS

    // MUST HAVE MERMAID
    if (!page.mermaid_diagram || typeof page.mermaid_diagram !== 'string' || !page.mermaid_diagram.includes("flowchart TD")) {
      throw new Error("Missing valid Mermaid flowchart TD diagram");
    }

    // MUST HAVE 3+ FAILURE MODES
    if (!page.failure_modes || !Array.isArray(page.failure_modes) || page.failure_modes.length < 3) {
      throw new Error("Insufficient failure modes (min 3)");
    }

    // 1. FAILURE MODE COVERAGE for CAUSES
    if (!page.causes || !Array.isArray(page.causes)) {
      throw new Error("Causes array missing");
    }

    const failureModeNames = page.failure_modes.map((m: any) => m.name);
    for (const cause of page.causes) {
      if (!failureModeNames.includes(cause.failure_mode)) {
        throw new Error(`Cause must map to valid failure mode: ${cause.name} -> ${cause.failure_mode}`);
      }
    }

    // 2. NO ORPHAN CAUSES
    const mappedModes = new Set(page.causes.map((c: any) => c.failure_mode));
    if (mappedModes.size !== page.failure_modes.length) {
      throw new Error("Every failure mode must have at least one assigned cause");
    }

    // 3. REPAIR COVERAGE
    if (!page.repairs || !Array.isArray(page.repairs)) {
      throw new Error("Repairs array missing");
    }
    for (const cause of page.causes) {
      const hasRepair = page.repairs.some((r: any) => r.cause === cause.name);
      if (!hasRepair) {
        throw new Error(`Missing repair for cause: ${cause.name}`);
      }
    }

    // 4. MERMAID VALIDATION
    for (const mode of page.failure_modes) {
      if (!page.mermaid_diagram.includes(mode.name)) {
        throw new Error(`Flowchart missing failure mode node: ${mode.name}`);
      }
    }

    // 5. ANTI-BLOG CHECK (fast_answer is object: technical_summary + primary_mechanism)
    if (page.fast_answer) {
      const blob =
        typeof page.fast_answer === "string"
          ? page.fast_answer
          : JSON.stringify(page.fast_answer);
      if (blob.includes("This article")) throw new Error("Contains blog jargon: 'This article'");
      if (blob.includes("In this guide")) throw new Error("Contains blog jargon: 'In this guide'");
    }

    // MUST HAVE GUIDED DIAGNOSIS
    if (!page.guided_diagnosis || !Array.isArray(page.guided_diagnosis) || page.guided_diagnosis.length < 3) {
      throw new Error("Guided diagnosis too shallow (min 3)");
    }

    // 6. FINAL STRICT CHECKS
    if (!page.mermaid_diagram.includes("?")) {
      throw new Error("Flowchart missing binary diagnostic questions (?)");
    }
    for (const cause of page.causes) {
      if (!cause.test || !cause.expected_result) {
        throw new Error(`Cause missing direct physical test or expected_result: ${cause.name}`);
      }
    }
    const genericModes = ["General", "System", "Other", "Unknown", "Miscellaneous"];
    for (const mode of page.failure_modes) {
      if (genericModes.includes(mode.name)) {
        throw new Error(`Failure mode is too generic, must represent physical state: ${mode.name}`);
      }
    }

  } catch (err: any) {
    return { valid: false, error: err.message, errors: [err.message] };
  }

  return { valid: true, errors: [] };
}
