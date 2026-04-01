import { validateV2 } from "@/lib/validators/validate-v2";

/** Single choke point for post-generation validation (extend with page_type branching). */
export function runDiagnosticValidation(payload: unknown): { ok: true } | { ok: false; error: string } {
  try {
    validateV2(payload);
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
