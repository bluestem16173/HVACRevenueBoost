import { DiagnosticEngineJson } from "../validation/diagnosticSchema";

export function scoreDiagnostic(payload: DiagnosticEngineJson): number {
  let score = 100;

  // Deduct for missing optional but recommended fields
  if (!payload.diagnosticIntro) {
    score -= 10;
  }
  
  // Scoring length of system explanation
  if (payload.systemExplanation && payload.systemExplanation.length <= 3) {
    score -= 5;
  }
  
  // Complexity of Mermaid
  if (payload.decision_tree && !payload.decision_tree.includes('?')) {
    score -= 10;
  }
  
  // Breadth of diagnostics
  if (payload.diagnosticFlow && payload.diagnosticFlow.length < 5) {
    score -= 5;
  }

  // Fallback constraints
  return Math.max(0, Math.min(100, score));
}
