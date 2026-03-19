import { validateCoreForPageType } from "../lib/prompt-schema-router";
import { calculateQualityScore } from "../lib/quality-scorer";

async function runTests() {
  console.log("--- STARTING VALIDATION TESTS ---");
  
  // Test 1: Explicit Fail-Case (missing tools) for Repair Page
  console.log("TEST 1: Missing tools_required on repair page");
  const badRepairData = {
    title: "How to Fix an AC",
    fast_answer: { summary: "This is a fix." },
    // tools_required is missing
    parts_required: ["capacitor"],
    steps: [
      { step: 1, title: "Step 1", detail: "Do this action right now with specificity.", risk_level: "low" },
      { step: 2, title: "Step 2", detail: "Do this action right now with specificity.", risk_level: "low" },
      { step: 3, title: "Step 3", detail: "Do this action right now with specificity.", risk_level: "low" },
      { step: 4, title: "Step 4", detail: "Do this action right now with specificity.", risk_level: "low" },
      { step: 5, title: "Step 5", detail: "Do this action right now with specificity.", risk_level: "low" },
    ],
    decision_logic: ["If X then Y", "If Z then B", "If A then C"],
    cost_breakdown: { parts: "$10", labor: "$100", emergency: "$200" },
    diy_vs_pro: { diy_when: ["always"], call_pro_when: ["never"] }
  };
  
  const v1 = validateCoreForPageType("repair", badRepairData);
  console.log("Test 1 Validation Result:", v1); // Should be invalid with 'Missing tools_required'

  // Test 2: Legacy-Kill Test (systems payload)
  console.log("\nTEST 2: Legacy 'systems' payload scoring");
  const legacyData = {
    systems: [
      { system: "AC", issues: ["Not cooling"] }
    ],
    summary: "Old legacy data."
  };
  
  const v2 = calculateQualityScore(legacyData, "<h1>Old</h1>", "repair");
  console.log("Test 2 Scorer Result:", v2); // Should have structuralPenalty (-50 down to needs_regen)
  
  console.log("--- END TESTS ---");
}

runTests();
