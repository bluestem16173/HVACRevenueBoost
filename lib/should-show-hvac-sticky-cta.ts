/**
 * Where the fixed bottom HVAC SMS bar may appear.
 * Excludes home, other trades, and generic hubs (diagnose/repair/etc.).
 */
export function shouldShowHvacStickyCta(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const p = pathname.split("?")[0] ?? "";

  if (p === "/hvac" || p.startsWith("/hvac/")) return true;
  if (p === "/commercial-hvac") return true;

  const standaloneHvac = new Set([
    "/hvac-ac-not-cooling",
    "/hvac-air-conditioning",
    "/hvac-airflow-ductwork",
    "/hvac-electrical-controls",
    "/hvac-heating-systems",
    "/hvac-maintenance",
    "/hvac-thermostats-controls",
  ]);

  return standaloneHvac.has(p);
}
