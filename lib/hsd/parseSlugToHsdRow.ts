import { canonicalLocalizedStorageSlug } from "@/lib/localized-city-path";
import { enforceStoredSlug } from "@/lib/slug-utils";
import type { HsdPageBuildRow } from "./types";

function titleCaseWords(slugPart: string): string {
  return slugPart
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function parseCityState(citySlug: string): { city: string; state: string } {
  const m = citySlug.trim().match(/^(.+)-([a-z]{2})$/i);
  if (m) {
    return { city: titleCaseWords(m[1]), state: m[2].toUpperCase() };
  }
  return { city: titleCaseWords(citySlug), state: "" };
}

function verticalToCategory(vertical: string): string {
  const v = vertical.toLowerCase();
  if (v === "plumbing") return "Plumbing";
  if (v === "electrical") return "Electrical";
  return "HVAC";
}

/**
 * Builds {@link HsdPageBuildRow} from a localized storage slug (`hvac/ac-not-cooling/tampa-fl`).
 */
export function parseSlugToHsdRow(rawSlug: string): HsdPageBuildRow {
  const slug = canonicalLocalizedStorageSlug(enforceStoredSlug(rawSlug));
  const parts = slug.split("/").filter(Boolean);
  if (parts.length < 3) {
    throw new Error(`HSD_Page_Build: expected vertical/symptom/city slug, got "${slug}"`);
  }
  const [vertical, symptomSlug, citySlug] = parts;
  const { city, state } = parseCityState(citySlug);
  if (!state) {
    throw new Error(`HSD_Page_Build: city slug must end with -XX state code (e.g. tampa-fl), got "${citySlug}"`);
  }
  return {
    slug,
    issue: titleCaseWords(symptomSlug),
    category: verticalToCategory(vertical),
    city,
    state,
  };
}
