import { diagnosticEngineJsonSchema } from "./diagnosticSchema";

export function validateDiagnostic(payload: any) {
  if (!payload) throw new Error("Empty payload");
  
  // Reject trailing HTML or commentary outside JSON
  if (typeof payload === 'string') {
    if (payload.includes('```')) {
      throw new Error("Payload contains markdown blocks, must be strict JSON");
    }
    try {
      payload = JSON.parse(payload);
    } catch (e) {
      throw new Error("Failed to parse JSON: " + (e as Error).message);
    }
  }

  // Use Zod for strict validation
  const result = diagnosticEngineJsonSchema.safeParse(payload);
  if (!result.success) {
    const errorMessages = result.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(", ");
    throw new Error(`Diagnostic JSON Validation Failed: ${errorMessages}`);
  }

  // Additional rules
  const { diagnosticFlow, systemExplanation } = result.data;
  
  if (systemExplanation.length < 3) {
    throw new Error("systemExplanation requires at least 3 items");
  }

  if (diagnosticFlow.length < 3) {
    throw new Error("diagnosticFlow requires at least 3 steps");
  }

  // Ensure no raw HTML inside JSON strings for SSR safety
  const jsonStr = JSON.stringify(payload);
  if (/<[a-z][\s\S]*>/i.test(jsonStr)) {
    throw new Error("No raw HTML inside JSON strings allowed for SSR safety");
  }

  return result.data;
}
