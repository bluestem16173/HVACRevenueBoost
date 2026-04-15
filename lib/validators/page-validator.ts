export type ValidationResult = {
  valid: boolean;
  errors?: string[]; 
  error?: string;    
};

export function validatePage(page: any): ValidationResult {
  if (!page) return { valid: false, error: "Empty payload", errors: ["Empty payload"] };

  try {
    // HARD FAIL CONDITIONS

    // --- HRB AUTHORITY SCHEMA VALIDATION ---
    if (page.layout === "hvac_authority_v1") {
      // 1. MINIMUM CONTENT BLOCKS
      if (!Array.isArray(page.summary_30s) || page.summary_30s.length < 2) {
        throw new Error("summary_30s must be an array with at least 2 strong bullets");
      }
      if (!Array.isArray(page.system_explanation) || page.system_explanation.length < 3) {
        throw new Error("system_explanation must have at least 3 distinct mechanic paragraphs");
      }
      
      // 2. FAILURE CLUSTERS
      if (!Array.isArray(page.failure_clusters) || page.failure_clusters.length < 4) {
        throw new Error("failure_clusters must contain at least 4 distinct category clusters");
      }
      page.failure_clusters.forEach((cluster: any, idx: number) => {
        if (!cluster.category || !cluster.why_it_causes_this_symptom || !Array.isArray(cluster.signals) || !cluster.first_checks || !cluster.typical_fix_path || !cluster.risk_if_ignored) {
          throw new Error(`Cluster at index ${idx} is missing required fields (category, why_it_causes_this_symptom, signals[], first_checks, typical_fix_path, risk_if_ignored)`);
        }
      });

      // 3. REPAIR MATRIX
      if (!Array.isArray(page.repair_matrix) || page.repair_matrix.length < 4) {
        throw new Error("repair_matrix must contain at least 4 rows");
      }
      page.repair_matrix.forEach((row: any, idx: number) => {
        if (typeof row.pro_required !== "boolean" || !row.issue_name || !row.cost_band || !row.urgency) {
          throw new Error(`repair_matrix at index ${idx} is missing or has malformed required fields`);
        }
      });

      // 4. WHEN TO STOP DIY (Safety)
      if (!Array.isArray(page.when_to_stop_diy) || page.when_to_stop_diy.length === 0) {
        throw new Error("when_to_stop_diy triggers missing");
      }
      const diyText = page.when_to_stop_diy.join(" ").toLowerCase();
      if (!diyText.includes("refrigerant") && !diyText.includes("electrical") && !diyText.includes("volt") && !diyText.includes("power")) {
        throw new Error("when_to_stop_diy must explicitly include electrical or refrigerant safety triggers");
      }

      // 5. MERMAID DIAGNOSTIC
      if (!page.decision_tree_mermaid || !page.decision_tree_mermaid.includes("flowchart TD")) {
        throw new Error("decision_tree_mermaid must start with 'flowchart TD'");
      }
      const mermaidNodes = page.decision_tree_mermaid.match(/[A-Z]+\[.*?\]/g) || [];
      const mermaidConditions = page.decision_tree_mermaid.match(/[A-Z]+\{.*?\}/g) || [];
      if ((mermaidNodes.length + mermaidConditions.length) < 6) {
        throw new Error("decision_tree_mermaid must contain at least 6 nodes/decisions");
      }

      // 6. DIAGNOSTIC FLOW
      if (!Array.isArray(page.diagnostic_flow) || page.diagnostic_flow.length < 3) {
        throw new Error("diagnostic_flow requires at least 3 logical steps");
      }

      return { valid: true, errors: [] };
    }

    // --- DG GOLD STANDARD VALIDATION (Legacy/Default) ---

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
