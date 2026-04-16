/**
 * Risk “tension” line under H1 — authority tone, no marketing banner.
 * Optional JSON: `tension_subhead` (plain string).
 */
export function getHsdTensionSubhead(
  data: Record<string, unknown>,
  storageSlug: string
): string {
  const direct = typeof data.tension_subhead === "string" ? data.tension_subhead.trim() : "";
  if (direct) return direct;

  const fromJson = typeof data.city === "string" ? data.city.trim() : "";
  const cityTitle =
    fromJson ||
    (() => {
      const cityMatch = storageSlug.match(/\/([a-z0-9-]+)$/i);
      const citySeg = cityMatch?.[1]?.replace(/-/g, " ") ?? "your area";
      return citySeg
        .split(" ")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    })();

  if (storageSlug.includes("ac-not-cooling")) {
    return `If your AC isn’t cooling in ${cityTitle} heat, small airflow or refrigerant issues can turn into compressor failure — often a $2,000+ repair — if not diagnosed correctly.`;
  }
  if (storageSlug.includes("ac-not-turning-on")) {
    return `No-start calls are usually power path, low voltage, or start components — guessing wastes time and can mask unsafe electrical conditions.`;
  }
  if (storageSlug.includes("ac-freezing-up") || storageSlug.includes("freezing")) {
    return `Ice is a symptom, not the disease — it often means airflow collapse or refrigerant behavior is pushing the coil past freezing; running through it risks compressor damage.`;
  }

  return `Small control or airflow faults get louder under peak load — confirm what the equipment is actually doing before you assume a major component failure.`;
}
