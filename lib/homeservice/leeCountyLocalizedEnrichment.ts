import type { ServiceVertical } from "@/lib/localized-city-path";
import { formatCityPathSegmentForDisplay } from "@/lib/localized-city-path";
import { enforceStoredSlug } from "@/lib/slug-utils";
import { LEE_COUNTY_CITIES } from "@/lib/vertical-hub-shared";

const LEE_CITY_SET = new Set<string>(LEE_COUNTY_CITIES.map((s) => s.toLowerCase()));

/** True when `slug` is `{vertical}/{pillar}/{city}` and `city` is a Lee County storage segment (`*-fl`). */
export function isLeeCountyCityStorageSlug(fullSlug: string): boolean {
  const parts = enforceStoredSlug(fullSlug).split("/").filter(Boolean);
  if (parts.length < 3) return false;
  return LEE_CITY_SET.has(String(parts[parts.length - 1] ?? "").toLowerCase());
}

/** `cityStorageSlug` e.g. `fort-myers-fl` — bullets for {@link HsdV25Payload.cityContext} (trade-specific). */
export function buildCityContextForLeeCountyCity(cityStorageSlug: string, vertical: ServiceVertical): string[] {
  const place = formatCityPathSegmentForDisplay(cityStorageSlug);
  if (vertical === "plumbing") {
    return [
      `In ${place} and across Lee County, hard water and high daily hot-water demand accelerate sediment, dip-tube, and element stress in tank heaters.`,
      "Coastal humidity and occasional storm water can speed exterior jacket rust and pan corrosion on garage or lanai installations—small weeps become slab/floor damage fast.",
      "When pressure fluctuates or hot water runs short during peak evening use, separate distribution issues from true heater faults before you buy parts.",
    ];
  }
  if (vertical === "electrical") {
    return [
      `In ${place} and across Lee County, heat-driven whole-home electrical load plus coastal moisture increases stress on breakers, GFCI devices, and outdoor disconnects.`,
      "Salt air accelerates corrosion on meter bases, panel lugs, and conduit bodies—thermal trips that ‘go away’ often return under the next humidity spike.",
      "After summer storms, surge and partial-power symptoms spike—verify what is branch-level versus utility-side before resetting equipment repeatedly.",
    ];
  }
  return [
    `In ${place} and across Lee County, high humidity and long cooling runtime increase failure rates for airflow paths, drains, and condensate handling.`,
    "Salt air exposure near coastal zones accelerates corrosion on electrical panels, disconnects, and outdoor HVAC equipment.",
    "Frequent start-stop cycling in hot, humid weather increases wear on capacitors, compressors, and pumps—get measured diagnosis before minor faults stack.",
  ];
}

/**
 * Lead-focused CTA for Lee County (must satisfy {@link assertCtaStrength}: $1,500+, stress, technician).
 * Electrical / plumbing / HVAC voice per product spec.
 */
export function buildLocalizedLeeCountyCta(vertical: ServiceVertical): string {
  if (vertical === "electrical") {
    return `Electrical issues in Lee County often worsen under load—especially during peak cooling hours when whole-home draw is highest. Shut off the affected circuit at the breaker and get a licensed electrician in Fort Myers or Cape Coral before damage spreads across feeders or panels. Faults left energized under summer humidity load routinely exceed $1,500 in repair scope—book a service call for measured testing before arc or heat stress escalates.`;
  }
  if (vertical === "plumbing") {
    return `In Southwest Florida’s humid climate, leaks and drain backups escalate quickly due to continuous use and moisture in wall and slab paths. Shut off the water main or fixture stop if you can and get a local plumber out before drywall, cabinet, and subfloor damage spreads. Standing water repairs commonly cross $1,500 once cabinetry and finishes are involved—schedule a licensed plumber for same-day diagnosis and containment.`;
  }
  return `In Southwest Florida heat, comfort systems that are underperforming can quickly turn into compressor or coil damage when runtime stretches trying to hold setpoint. Stop extended runtime once comfort stalls and schedule a licensed HVAC technician before sealed-system stress stacks repair cost. Letting it run wrong under humidity load often exceeds $1,500 in compressor-class or coil-and-charge work—book service in Fort Myers, Cape Coral, or nearby Lee County before peak demand adds more load.`;
}

/** Mutates HSD v2.5 JSON in place when the page is a Lee County localized pillar. */
export function applyLeeCountyLocalizedEnrichmentToHsdJson(
  json: Record<string, unknown>,
  storageSlug: string,
  vertical: ServiceVertical
): void {
  if (!isLeeCountyCityStorageSlug(storageSlug)) return;
  const parts = enforceStoredSlug(storageSlug).split("/").filter(Boolean);
  const citySeg = parts[parts.length - 1] ?? "";
  if (!citySeg) return;
  json.cityContext = buildCityContextForLeeCountyCity(citySeg, vertical);
  json.cta = buildLocalizedLeeCountyCta(vertical);
}
