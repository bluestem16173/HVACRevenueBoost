/**
 * Lee County, FL — **storage** city segments for `pages.slug` / URLs (`{city}-fl`).
 * DB paths must use these exact tails (e.g. `hvac/ac-not-cooling/fort-myers-fl`).
 *
 * Same metros as the locked initial monetization cluster
 * (`lib/homeservice/leeCountyInitialMonetizationCluster.ts`).
 */
export const LEE_COUNTY_CITIES = [
  "fort-myers-fl",
  "cape-coral-fl",
  "estero-fl",
  "fort-myers-beach-fl",
  "sanibel-fl",
  "north-captiva-fl",
  "gateway-fl",
] as const;

/** Human labels aligned with {@link LEE_COUNTY_CITIES} (same order). */
export const FL_EXAMPLE_CITIES: { label: string; slug: string }[] = [
  { label: "Fort Myers", slug: "fort-myers-fl" },
  { label: "Cape Coral", slug: "cape-coral-fl" },
  { label: "Estero", slug: "estero-fl" },
  { label: "Fort Myers Beach", slug: "fort-myers-beach-fl" },
  { label: "Sanibel", slug: "sanibel-fl" },
  { label: "North Captiva", slug: "north-captiva-fl" },
  { label: "Gateway", slug: "gateway-fl" },
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
