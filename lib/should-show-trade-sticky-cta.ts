import type { HomeServiceTrade } from "@/lib/homeservice/inferHomeServiceTrade";
import { inferHomeServiceTradeFromPathname } from "@/lib/homeservice/inferHomeServiceTrade";

/**
 * Where the fixed bottom SMS lead bar may appear.
 * Trade follows the URL prefix (`/hvac/…`, `/plumbing/…`, `/electrical/…`).
 * Excludes unrelated hubs (home, RV-only islands without trade path, etc.).
 */
export function shouldShowTradeStickyCta(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const p = pathname.split("?")[0] ?? "";

  if (p === "/plumbing" || p.startsWith("/plumbing/")) return true;
  if (p === "/electrical" || p.startsWith("/electrical/")) return true;

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

export function stickyCtaTradeFromPathname(pathname: string | null | undefined): HomeServiceTrade {
  if (!shouldShowTradeStickyCta(pathname)) return "hvac";
  return inferHomeServiceTradeFromPathname(pathname);
}
