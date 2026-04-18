import type { HsdV25Payload } from "@/lib/validation/hsdV25Schema";
import { HSD_SCAFFOLDING_SUBSTRINGS } from "@/lib/hsd/scaffoldingConstants";

function mapDeepStrings(value: unknown, fn: (s: string) => string): unknown {
  if (typeof value === "string") return fn(value);
  if (Array.isArray(value)) return value.map((x) => mapDeepStrings(x, fn));
  if (value !== null && typeof value === "object") {
    const o = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(o)) {
      out[k] = mapDeepStrings(o[k], fn);
    }
    return out;
  }
  return value;
}

function stripScaffoldingFromString(s: string): string {
  let t = s;
  for (const sub of HSD_SCAFFOLDING_SUBSTRINGS) {
    t = t.split(sub).join("");
  }
  t = t.replace(/\bCTA\b/g, "");
  return t
    .split(/\n\n+/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

/** Removes known UI scaffolding phrases from every string leaf (clone). */
export function removeScaffoldingFromPayload(page: HsdV25Payload): HsdV25Payload {
  const clone = structuredClone(page) as unknown;
  return mapDeepStrings(clone, stripScaffoldingFromString) as HsdV25Payload;
}
