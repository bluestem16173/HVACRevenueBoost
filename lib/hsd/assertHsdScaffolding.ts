import type { HsdV25Payload } from "@/lib/validation/hsdV25Schema";
import { collectAllStringLeaves } from "@/lib/hsd/hsdJsonStringLeaves";
import { HSD_SCAFFOLDING_SUBSTRINGS } from "@/lib/hsd/scaffoldingConstants";

/** Reject if model pasted UI scaffolding into JSON. */
export function assertNoForbiddenScaffoldingInPayload(page: HsdV25Payload): void {
  const acc: string[] = [];
  collectAllStringLeaves(page, acc);
  const blob = acc.join("\u0000");
  for (const f of HSD_SCAFFOLDING_SUBSTRINGS) {
    if (blob.includes(f)) {
      throw new Error(`Scaffolding text detected in JSON: forbidden substring "${f}"`);
    }
  }
  if (acc.some((s) => /\bCTA\b/.test(s))) {
    throw new Error('Scaffolding text detected in JSON: standalone "CTA" label (use plain language)');
  }
}
