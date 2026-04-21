import type { ServiceVertical } from "@/lib/localized-city-path";
import {
  buildCityContextForLeeCountyCity,
  isLeeCountyCityStorageSlug,
} from "@/lib/homeservice/leeCountyLocalizedEnrichment";

/**
 * Deterministic fill-ins when the model returns JSON that is close but fails
 * Zod superRefine or {@link assertHsdV25ContentRules} on headline / flow_lines only.
 * Does not replace valid content.
 */
function cityLoadFromStorageSlug(slug: string): string {
  const seg = String(slug ?? "").split("/").filter(Boolean).pop() ?? "";
  const m = seg.match(/^([a-z][a-z-]*)-([a-z]{2})$/i);
  if (!m) return "Local load context";
  const city = m[1].replace(/-/g, " ");
  const pretty = city.replace(/\b\w/g, (c) => c.toUpperCase());
  return `${pretty}, ${m[2].toUpperCase()}`;
}

function issueTitleFromSlug(slug: string): string {
  const parts = String(slug ?? "").split("/").filter(Boolean);
  const raw = parts[1] ?? "issue";
  return raw
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** {@link assertHsdV25ContentRules} requires ≥1 row with cost_max ≥ 1500 — model sometimes returns all low bands. */
function ensureRepairMatrixHighCostScenario(json: Record<string, unknown>): void {
  const rm = json.repair_matrix;
  if (!Array.isArray(rm) || rm.length === 0) return;
  const hasHigh = rm.some((row) => {
    if (!row || typeof row !== "object") return false;
    const n = Number((row as Record<string, unknown>).cost_max);
    return Number.isFinite(n) && n >= 1500;
  });
  if (hasHigh) return;
  const last = rm[rm.length - 1];
  if (!last || typeof last !== "object") return;
  const o = last as Record<string, unknown>;
  const lo = Number(o.cost_min);
  const hi = Number(o.cost_max);
  const safeLo = Number.isFinite(lo) ? Math.min(lo, 1400) : 800;
  o.cost_min = safeLo;
  o.cost_max = 2200;
  if (!String(o.difficulty ?? "").trim()) o.difficulty = "pro";
}

export function patchHsdLlmJsonMinimumGates(json: Record<string, unknown>): void {
  const slug = String(json.slug ?? "").trim();
  const load = cityLoadFromStorageSlug(slug);
  const parts = slug.split("/").filter(Boolean);
  const verticalRaw = (parts[0] ?? "hvac").toLowerCase();
  const vertical: ServiceVertical =
    verticalRaw === "plumbing" || verticalRaw === "electrical" ? verticalRaw : "hvac";
  const isHvac = vertical === "hvac";

  const s30 = json.summary_30s;
  if (s30 && typeof s30 === "object") {
    const o = s30 as Record<string, unknown>;

    let h = String(o.headline ?? "").trim();
    if (h.length < 50) {
      const issueTit = issueTitleFromSlug(slug);
      const base = h.length > 0 ? h : `${issueTit} triage gate`;
      o.headline = isHvac
        ? `${base} — ${load}: separate outdoor electrical buzz, belt or bearing squeal, and rattling hardware before sealed-system spend.`
        : `${base} — ${load}: separate quick safe checks from call-a-pro failure paths before damage and cost stack.`;
    }

    const flRaw = o.flow_lines;
    const lines = Array.isArray(flRaw)
      ? flRaw.map((x) => String(x ?? "").trim()).filter(Boolean)
      : [];
    if (lines.length < 4) {
      o.flow_lines = isHvac
        ? [
            "Noise triage (scan):",
            "→ Outdoor buzz at compressor start/stop → contactor / capacitor class",
            "→ Squeal changing with blower speed → belt or motor bearing class",
            "→ Rattle only when air moves → loose panels / hardware class",
          ]
        : [
            "Field triage (scan):",
            "→ Stable vs intermittent pattern → control vs mechanical class",
            "→ Worsens under load vs idle → stress-dependent fault class",
            "→ Localized vs spreading symptom → containment vs systemic class",
          ];
    }
  }

  if (parts.length >= 3) {
    const rawLines = Array.isArray(json.cityContext)
      ? (json.cityContext as unknown[]).map((x) => String(x ?? "").trim()).filter(Boolean)
      : [];
    if (rawLines.length === 0) {
      const citySeg = String(parts[parts.length - 1] ?? "");
      if (isLeeCountyCityStorageSlug(slug) && citySeg) {
        json.cityContext = buildCityContextForLeeCountyCity(citySeg, vertical, parts[1] ?? undefined);
      } else if (vertical === "plumbing") {
        json.cityContext = [
          `In ${load}, hard water and peak evening hot-water demand accelerate sediment and element stress in tank heaters.`,
          "Coastal humidity speeds exterior jacket rust on garage or lanai units—small weeps become floor and cabinet damage quickly.",
          "When pressure swings or hot water ends early, verify distribution and mixing before assuming the tank alone failed.",
        ];
      } else if (vertical === "electrical") {
        json.cityContext = [
          `In ${load}, heat-driven electrical load and coastal moisture increase breaker, GFCI, and outdoor disconnect stress.`,
          "Salt air corrodes meter bases, panel lugs, and conduit bodies—intermittent trips often return under the next humidity spike.",
          "After storms, separate branch faults from utility-side loss before repeated resets damage equipment.",
        ];
      } else {
        json.cityContext = [
          `In ${load}, high humidity and long equipment runtime increase failure rates for airflow and drainage systems.`,
          "Salt air exposure near coastal zones accelerates corrosion on electrical panels and outdoor HVAC units.",
          "Frequent system cycling in hot climates increases wear on capacitors, compressors, and pumps.",
        ];
      }
    }
  }

  ensureRepairMatrixHighCostScenario(json);
}
