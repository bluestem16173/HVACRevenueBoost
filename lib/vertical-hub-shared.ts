/**
 * Lee County, FL — **storage** city segments for `pages.slug` / URLs (`{city}-fl`).
 * DB paths must use these exact tails (e.g. `electrical/breaker-keeps-tripping/fort-myers-fl`).
 *
 * **Locked Lee County expansion grid** (10 cities — do not expand without product sign-off):
 * Fort Myers, Cape Coral, Lehigh Acres, Bonita Springs, Estero, North Fort Myers, Fort Myers Beach,
 * San Carlos Park, Gateway, Alva.
 *
 * Aligned with {@link LEE_MONETIZATION_* } in `lib/homeservice/leeCountyInitialMonetizationCluster.ts`.
 */
export const LEE_COUNTY_CITIES = [
  "fort-myers-fl",
  "cape-coral-fl",
  "lehigh-acres-fl",
  "bonita-springs-fl",
  "estero-fl",
  "north-fort-myers-fl",
  "fort-myers-beach-fl",
  "san-carlos-park-fl",
  "gateway-fl",
  "alva-fl",
] as const;

/** Cross-city cluster links for Lee trade locals point here first (satellite → hub). */
export const LEE_COUNTY_CROSS_CITY_HUB = "fort-myers-fl";

/** Human labels aligned with {@link LEE_COUNTY_CITIES} (same order). */
export const FL_EXAMPLE_CITIES: { label: string; slug: string }[] = [
  { label: "Fort Myers", slug: "fort-myers-fl" },
  { label: "Cape Coral", slug: "cape-coral-fl" },
  { label: "Lehigh Acres", slug: "lehigh-acres-fl" },
  { label: "Bonita Springs", slug: "bonita-springs-fl" },
  { label: "Estero", slug: "estero-fl" },
  { label: "North Fort Myers", slug: "north-fort-myers-fl" },
  { label: "Fort Myers Beach", slug: "fort-myers-beach-fl" },
  { label: "San Carlos Park", slug: "san-carlos-park-fl" },
  { label: "Gateway", slug: "gateway-fl" },
  { label: "Alva", slug: "alva-fl" },
];

/** Default localized example for marketing copy (Lee County primary). */
export const FL_EXAMPLE_PRIMARY_CITY_SLUG = LEE_COUNTY_CITIES[0];

export const HOW_IT_WORKS_STEPS = [
  {
    step: "1",
    title: "Identify the issue",
    body: "Pick the symptom cluster that matches what you are seeing at home.",
  },
  {
    step: "2",
    title: "Diagnose the cause",
    body: "Follow structured checks so you are not guessing at expensive parts.",
  },
  {
    step: "3",
    title: "Fix it or get help",
    body: "Decide what is safe to DIY, then connect with a pro when you are ready.",
  },
] as const;
