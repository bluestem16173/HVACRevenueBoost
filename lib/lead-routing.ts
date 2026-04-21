/** Lee primary hub city — URL / storage tail used for simple vendor routing. */
export const ROUTING_CITY_BRYAN = "fort-myers-fl";

/**
 * Simple routing: Fort Myers locals → Bryan; everything else → shared pool.
 */
export function routedToForCitySlugs(input: {
  page_city_slug?: string | null;
  city_slug?: string | null;
}): "bryan" | "lead_pool" {
  const c = (input.page_city_slug || input.city_slug || "").trim().toLowerCase();
  if (c === ROUTING_CITY_BRYAN) return "bryan";
  return "lead_pool";
}
