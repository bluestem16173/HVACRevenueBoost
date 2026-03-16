/**
 * Location data for lead-gen pages.
 * Florida-only for now—scale to other states later.
 */

import { CITIES } from "@/data/knowledge-graph";

export interface City {
  name: string;
  slug: string;
  state: string;
}

/** Florida cities only — we'll scale to other states later */
export const FLORIDA_CITIES: City[] = CITIES.filter((c) => c.state === "FL");

/** Group cities by state. For now: Florida only. */
export function getCitiesByState(): { state: string; stateName: string; cities: City[] }[] {
  const byState = new Map<string, City[]>();
  for (const city of FLORIDA_CITIES) {
    if (!byState.has(city.state)) byState.set(city.state, []);
    byState.get(city.state)!.push(city);
  }
  const stateNames: Record<string, string> = { FL: "Florida" };
  return Array.from(byState.entries()).map(([state, cities]) => ({
    state,
    stateName: stateNames[state] || state,
    cities: cities.sort((a, b) => a.name.localeCompare(b.name)),
  }));
}
