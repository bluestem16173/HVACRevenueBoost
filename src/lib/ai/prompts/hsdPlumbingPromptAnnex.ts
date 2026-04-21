import { enforceStoredSlug } from "@/lib/slug-utils";

/**
 * Plumbing-only HSD user-prompt annex (appended in {@link buildPrompt}).
 * Keeps the shared veteran template HVAC-neutral and reduces cross-trade drift.
 */

const PLUMBING_BASE = `
### Plumbing (all \`plumbing/…\` slugs)

- Failure classes to branch: **supply**, **drainage**, **fixture** — pick the dominant class for this symptom before component guessing.
- Prefer **observation gates** (pressure change, single-fixture vs whole-home, hot-only vs cold-only, trap prime, cleanout access) over essay-style system explanations.
- DIY stops: **sewer gas without diagnosis**, **open DWV without a plan**, **gas water heater** work beyond trivial relight/setting checks, **soldered potable** repairs without licensing context in **call_pro**.
`.trim();

const NO_HOT_WATER = `
### \`plumbing/no-hot-water\` (localized + pillar)

**summary_30s.flow_lines:** Prefer four **question → class** one-liners (hard loss vs lukewarm vs fast runout vs rusty water).

**what_this_means (electric tank emphasis when that path fits the slug):** Lead with **failed heat transfer** physics (element open → no current → no heat; thermostat never calls → element stays off; sediment insulates element → heat trapped → burnout). **Forbidden opener tone:** "The system is not producing hot water due to a failure…" / generic blog narration.

**diagnostic_steps:** Render as a **checklist ladder** — bold **step** titles like "Step 1 — Check power"; **homeowner** line is the **IF → branch** (short); **pro** is one measurement/verification clause; **risk** keeps a **$** band. Avoid essay-style "first you should understand how a water heater works…" copy.
`.trim();

/** Pillar segment after \`plumbing/\` */
function plumbingPillarFromStorageSlug(storageSlug: string): string {
  const parts = enforceStoredSlug(storageSlug).split("/").filter(Boolean);
  if (parts[0]?.toLowerCase() !== "plumbing") return "";
  return (parts[1] ?? "").toLowerCase();
}

export function plumbingAnnexForSlug(storageSlug: string): string {
  const pillar = plumbingPillarFromStorageSlug(storageSlug);
  const blocks = ["---", "PLUMBING ANNEX (follow in addition to the shared JSON contract above)", "---", PLUMBING_BASE];
  if (pillar === "no-hot-water") {
    blocks.push(NO_HOT_WATER);
  }
  return blocks.join("\n\n");
}
