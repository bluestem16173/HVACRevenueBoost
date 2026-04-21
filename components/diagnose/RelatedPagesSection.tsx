import Link from "next/link";

import { formatCityPathSegmentForDisplay } from "@/lib/localized-city-path";
import { enforceStoredSlug } from "@/lib/slug-utils";
import { LEE_COUNTY_CITIES } from "@/lib/vertical-hub-shared";

const LEE_CITY_ORDER = [...LEE_COUNTY_CITIES];
const LEE_CITY_SET = new Set(LEE_COUNTY_CITIES.map((c) => c.toLowerCase()));

/** Label for the national pillar link (trade scope, not the long condition slug). */
function tradeTroubleshootingGuideLabel(trade: string): string {
  const t = trade.toLowerCase();
  if (t === "hvac") return "HVAC troubleshooting guide";
  if (t === "electrical") return "Electrical troubleshooting guide";
  if (t === "plumbing") return "Plumbing troubleshooting guide";
  const head = trade.charAt(0).toUpperCase() + trade.slice(1).toLowerCase();
  return `${head} troubleshooting guide`;
}

function formatCitySlugForNearbyLabel(slug: string): string {
  const readable = formatCityPathSegmentForDisplay(slug).split(",")[0]?.trim();
  if (readable) return readable;
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function capitalizeFirstChar(text: string): string {
  const t = text.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Same trade + condition, other Lee grid cities (max 3). Empty when current city is outside the grid. */
function getCrossCityLinks(trade: string, condition: string, citySlug: string) {
  const cur = citySlug.toLowerCase();
  if (!LEE_CITY_SET.has(cur)) return [];

  return LEE_CITY_ORDER.filter((c) => c.toLowerCase() !== cur)
    .slice(0, 3)
    .map((c) => {
      const tail = c.toLowerCase();
      const place = formatCitySlugForNearbyLabel(tail);
      const rawLabel = `${condition.replace(/-/g, " ")} in ${place}`;
      return {
        href: `/${trade}/${condition}/${tail}`,
        label: capitalizeFirstChar(rawLabel),
      };
    });
}

/**
 * UI-only Related Pages for `{trade}/{condition}/{city}` locals — not driven by LLM JSON.
 * Mounted from programmatic renderers (`renderPlumbingElectricalCity`, `renderHvacDeepAuthority`) and from
 * `FooterRelatedPagesSlot` for other matching URL shapes (e.g. `/diagnose/...`).
 */
export function RelatedPagesSection({
  slug,
  sectionClassName,
}: {
  slug: string;
  /** Optional Tailwind margin overrides (e.g. `mt-0` in the layout footer slot). */
  sectionClassName?: string;
}) {
  const normalized = enforceStoredSlug(slug).toLowerCase();
  const parts = normalized.split("/").filter(Boolean);

  if (parts.length !== 3) return null;

  const trade = parts[0];
  const condition = parts[1];
  const citySlug = parts[2];

  if (!trade || !condition || !citySlug) return null;

  const cityReadable = citySlug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const crossCityLinks = getCrossCityLinks(trade, condition, citySlug);

  const linkClass =
    "text-slate-300 underline-offset-2 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  const cardClass =
    "flex min-h-full min-w-0 flex-1 flex-col rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-md dark:border-slate-600";

  return (
    <section
      className={`mx-auto max-w-5xl ${sectionClassName ?? "mt-12"}`}
      aria-label="Related guides and nearby cities"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-6">
        <div className={cardClass} aria-labelledby="diagnose-related-pages-heading">
          <h3 id="diagnose-related-pages-heading" className="mb-3 text-lg font-semibold text-white">
            Related Pages
          </h3>
          <ul className="space-y-2 text-slate-300">
            <li>
              <Link href={`/${trade}/${condition}`} className={linkClass}>
                {tradeTroubleshootingGuideLabel(trade)}
              </Link>
            </li>
            <li>
              <Link href={`/${trade}/outlet-not-working/${citySlug}`} className={linkClass}>
                {`Outlet not working in ${cityReadable}`}
              </Link>
            </li>
            <li>
              <Link href={`/${trade}/lights-flickering/${citySlug}`} className={linkClass}>
                {`Lights flickering in ${cityReadable}`}
              </Link>
            </li>
          </ul>
        </div>

        {crossCityLinks.length > 0 ? (
          <div className={cardClass} aria-labelledby="nearby-cities-heading">
            <h3 id="nearby-cities-heading" className="mb-3 text-lg font-semibold text-white">
              Nearby Cities
            </h3>
            <ul className="space-y-2 text-slate-300">
              {crossCityLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
