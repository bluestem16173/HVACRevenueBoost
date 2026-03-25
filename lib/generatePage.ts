/**
 * Page generation surface — same env guard as the worker and API routes.
 * Implementation lives in content-engine/generator.ts.
 */
export {
  generateTwoStagePage,
  generateDiagnosticEngineJson,
} from "./content-engine/generator";

export {
  generationGloballyDisabled,
  generationDisabledResponse,
} from "./generation-guards";
