/** National HVAC pillar path (symptom hub under `/hvac`). */
export function hvacPillarPath(slug: string): string {
  return `/hvac/${slug.trim().toLowerCase()}`;
}

export const HVAC_SYSTEM_HUB_PATHS = {
  airConditioning: "/hvac/air-conditioning",
  airflow: "/hvac/airflow-ductwork",
  heating: "/hvac/heating-systems",
  electrical: "/hvac/electrical-controls",
  maintenance: "/hvac/maintenance",
} as const;
