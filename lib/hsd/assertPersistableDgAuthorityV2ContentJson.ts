import { GENERATED_PAGE_LAYOUT } from "@/lib/generated-page-json-contract";
import {
  assertDgAuthorityV2StructuredPayload,
  isStructuredDgAuthorityV2Payload,
} from "@/lib/dg/validateDgAuthorityV2Structured";
import {
  assertDgAuthorityV3StructuredPayload,
  isStructuredDgAuthorityV3Payload,
} from "@/lib/dg/validateDgAuthorityV3Structured";

/**
 * Hard gate immediately before `pages` upsert for DG Authority JSON payloads.
 * - **Structured v3**: {@link assertDgAuthorityV3StructuredPayload}
 * - **Structured v2**: {@link assertDgAuthorityV2StructuredPayload}
 * - **HSD locked** flat JSON: `layout` + `schema_version` v2, object `diagnostic_flow`, `summary_30s`.
 */
export function assertPersistableDgAuthorityV2ContentJson(content: unknown): void {
  if (!content || typeof content !== "object") {
    throw new Error("content_json must be a non-null object");
  }
  const o = content as Record<string, unknown>;
  if (!o.layout) {
    throw new Error("Invalid layout");
  }

  if (isStructuredDgAuthorityV3Payload(o)) {
    assertDgAuthorityV3StructuredPayload(o);
    return;
  }

  if (o.layout !== GENERATED_PAGE_LAYOUT) {
    throw new Error("Invalid layout");
  }

  if (isStructuredDgAuthorityV2Payload(o)) {
    assertDgAuthorityV2StructuredPayload(o);
    return;
  }

  if (o.diagnostic_flow == null || typeof o.diagnostic_flow !== "object") {
    throw new Error("Missing diagnostic flow");
  }
  if (!o.summary_30s) {
    throw new Error("Missing summary");
  }
}
