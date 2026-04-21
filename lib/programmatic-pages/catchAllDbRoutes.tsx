import type { Metadata } from "next";
import Link from "next/link";
import ElectricalTradeHubPage from "@/components/hubs/ElectricalTradeHubPage";
import HvacTradeHubPage from "@/components/hubs/HvacTradeHubPage";
import HvacWhyAcIsntCoolingPillar from "@/components/hubs/HvacWhyAcIsntCoolingPillar";
import PlumbingTradeHubPage from "@/components/hubs/PlumbingTradeHubPage";
import { DiagnosticPageView } from "@/components/DiagnosticPageView";
import { RelatedPagesSection } from "@/components/diagnose/RelatedPagesSection";
import { DiagnosticVerticalNav } from "@/components/diagnostic-hub/DiagnosticVerticalNav";
import { HvacAuthorityLoopNav } from "@/components/homeservice/HvacAuthorityLoopNav";
import { RenderAuthority } from "@/components/RenderAuthority";
import {
  getIndexablePageBySlug,
  getIndexablePageForLocalizedRoute,
  getPageBySlug,
} from "@/lib/get-indexable-page";
import { formatCityPathSegmentForDisplay, joinedSlugEndsWithCityStorage } from "@/lib/localized-city-path";
import { canonicalMetadata, siteCanonicalUrl } from "@/lib/seo/canonical";
import { isIndexableProblemPillar } from "@/lib/seo/indexable-pillars";
import { robotsForDbBackedPage } from "@/lib/seo/strict-indexing";
import { isLocalizedTradeTripletEligibleForIndexingRobots } from "@/lib/seo/tier-one-discovery";
import { getSystemHub, getSymptomsForHub, SYSTEM_HUBS } from "@/lib/system-hubs";
import {
  canonicalPagesSlugPathKeys,
  normalizeCatchAllParamsSlugPath,
} from "@/lib/slug-utils";
import sql from "@/lib/db";
import { HVAC_PILLAR_WHY_AC_ISNT_COOLING_V3 } from "@/lib/dg-authority-structured-preview/dgAuthorityV3Demos";

const HVAC_SLUG_MAP: Record<string, string> = {
  "air-conditioning": "hvac-air-conditioning",
  "heating-systems": "hvac-heating-systems",
  "airflow-ductwork": "hvac-airflow-ductwork",
  "electrical-controls": "hvac-electrical-controls",
  "thermostats-controls": "hvac-thermostats-controls",
  maintenance: "hvac-maintenance",
};

/** `/hvac/...` deep rows: SQL + authority render (segments after `hvac/`). */
function finalHvacLookupSlug(tail: string[]): string {
  const raw = tail.join("/") || "";
  const normalized = normalizeCatchAllParamsSlugPath(tail);
  const final = normalized ?? `/${raw}`.replace(/\/+/g, "/").replace(/\/$/, "");
  const { withLeading } = canonicalPagesSlugPathKeys(final);
  return withLeading;
}

async function selectPageByFullSlugPath(fullSlug: string): Promise<Record<string, unknown> | null> {
  const { withLeading, noLeading } = canonicalPagesSlugPathKeys(fullSlug);
  if (!noLeading) return null;
  const rows = (await sql`
    SELECT *
    FROM pages
    WHERE LOWER(slug) = ${noLeading}
       OR LOWER(slug) = ${withLeading}
    LIMIT 1
  `) as Record<string, unknown>[];
  return rows.length ? rows[0]! : null;
}

function hasRenderableBody(row: Record<string, unknown>): boolean {
  const cj = row.content_json;
  if (cj != null) {
    if (typeof cj === "object" && !Array.isArray(cj) && Object.keys(cj as object).length > 0) return true;
    if (typeof cj === "string" && cj.trim().length > 0) return true;
  }
  const ch = row.content_html;
  return typeof ch === "string" && ch.trim().length > 0;
}

export async function renderHvacDeepAuthority(tail: string[]): Promise<React.ReactNode | null> {
  const raw = tail.join("/") || "";
  if (!raw.trim()) return null;
  const fullSlug = finalHvacLookupSlug(tail);
  const row = await selectPageByFullSlugPath(fullSlug);
  if (!row) {
    return (
      <div className="p-6 text-slate-600">
        Missing slug: {fullSlug}
      </div>
    );
  }
  if (!hasRenderableBody(row)) {
    return <div className="p-6 text-slate-600">Page not generated yet: {fullSlug}</div>;
  }
  const parts = raw.split("/").filter(Boolean);
  const symptom = String(parts[0] ?? "").trim().toLowerCase();
  const isCityPage = joinedSlugEndsWithCityStorage(raw);
  const citySeg = isCityPage && parts.length >= 2 ? String(parts[parts.length - 1] ?? "").toLowerCase() : "";
  const relatedPagesSlug =
    isCityPage && symptom && citySeg ? `hvac/${symptom}/${citySeg}`.toLowerCase() : null;

  if (row.content_json) {
    return (
      <>
        {isCityPage && symptom ? (
          <HvacAuthorityLoopNav variant="city" symptom={symptom} citySlug={citySeg || null} />
        ) : null}
        <RenderAuthority content={row.content_json} vertical="hvac" />
        {relatedPagesSlug ? <RelatedPagesSection slug={relatedPagesSlug} /> : null}
      </>
    );
  }
  const ch = row.content_html;
  if (typeof ch === "string" && ch.trim().length > 0) {
    return (
      <>
        {isCityPage && symptom ? (
          <HvacAuthorityLoopNav variant="city" symptom={symptom} citySlug={citySeg || null} />
        ) : null}
        <div dangerouslySetInnerHTML={{ __html: ch }} />
        {relatedPagesSlug ? <RelatedPagesSection slug={relatedPagesSlug} /> : null}
      </>
    );
  }
  return (
    <>
      {isCityPage && symptom ? (
        <HvacAuthorityLoopNav variant="city" symptom={symptom} citySlug={citySeg || null} />
      ) : null}
      <div className="p-6 text-slate-600">No renderable content_json or content_html.</div>
      {relatedPagesSlug ? <RelatedPagesSection slug={relatedPagesSlug} /> : null}
    </>
  );
}

export async function renderHvacTwoSegment(segment: string): Promise<React.ReactNode | null> {
  if (segment.toLowerCase() === "why-ac-isnt-cooling") {
    return <HvacWhyAcIsntCoolingPillar />;
  }
  if (HVAC_SLUG_MAP[segment]) {
    const hubSlug = HVAC_SLUG_MAP[segment];
    const hub = getSystemHub(hubSlug);
    if (!hub) return null;
    const symptoms = getSymptomsForHub(hub);
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <nav className="mx-auto max-w-4xl px-4 py-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-hvac-blue">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/hvac" className="hover:text-hvac-blue">
            HVAC
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-gray-900 dark:text-white">{hub.name}</span>
        </nav>
        <section className="mx-auto max-w-4xl px-4 py-12">
          <div className="mb-4 inline-block rounded-full bg-hvac-blue/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-hvac-blue">
            System Hub
          </div>
          <h1 className="mb-6 text-4xl font-black leading-tight text-hvac-navy dark:text-white md:text-5xl">{hub.name}</h1>
          <p className="mb-12 text-lg leading-relaxed text-gray-600 dark:text-slate-400">{hub.description}</p>
          <h2 className="mb-6 text-2xl font-bold text-hvac-navy dark:text-white">
            Common {hub.name.replace("HVAC ", "")} problems
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {symptoms.map((symptom: { id: string; name: string; description: string }) => (
              <Link
                key={symptom.id}
                href={`/hvac/${symptom.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-6 transition hover:border-hvac-blue hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <h3 className="mb-2 font-bold text-hvac-navy dark:text-white">{symptom.name}</h3>
                <p className="line-clamp-2 text-sm text-gray-500 dark:text-slate-400">{symptom.description}</p>
                <span className="mt-3 inline-block text-xs font-bold uppercase tracking-wider text-hvac-blue">
                  Diagnostic pillar →
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-16 border-t border-slate-200 pt-12 dark:border-slate-800">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-500">Other system hubs</h3>
            <div className="flex flex-wrap gap-3">
              {SYSTEM_HUBS.filter((h) => h.slug !== hub.slug).map((h) => {
                const shortSlug = Object.entries(HVAC_SLUG_MAP).find(([, v]) => v === h.slug)?.[0] || h.slug;
                return (
                  <Link
                    key={h.slug}
                    href={`/hvac/${shortSlug}`}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-hvac-blue dark:border-slate-700 dark:bg-slate-900"
                  >
                    {h.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    );
  }

  const storageSlug = `hvac/${segment}`.toLowerCase();
  const dbPillar = await getPageBySlug(storageSlug);
  if (dbPillar != null && (dbPillar as { content_json?: unknown }).content_json != null) {
    return <RenderAuthority content={(dbPillar as { content_json: unknown }).content_json} vertical="hvac" />;
  }

  let page = await getIndexablePageBySlug(`hvac/${segment}`);
  if (!page) page = await getIndexablePageBySlug(segment);
  if (!page) page = await getIndexablePageBySlug(`diagnose/${segment}`);
  if (page) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 pt-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-hvac-blue">
            Home
          </Link>
          <span className="text-slate-300">/</span>
          <Link href="/hvac" className="hover:text-hvac-blue">
            HVAC
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {(page as { title?: string | null }).title || segment.replace(/-/g, " ")}
          </span>
        </nav>
        <p className="mx-auto max-w-4xl px-4 pb-2 text-xs text-slate-500">
          Localized guides: open your city from the{" "}
          <Link href="/hvac" className="text-hvac-blue hover:underline">
            HVAC hub
          </Link>{" "}
          or append <span className="font-mono">/{`{city}`}</span> to this URL.
        </p>
        <HvacAuthorityLoopNav variant="pillar" symptom={segment} />
        <div className="mx-auto max-w-4xl px-4">
          <DiagnosticVerticalNav vertical="hvac" pillarSlug={segment} citySlug={null} />
        </div>
        <DiagnosticPageView page={page as any} localLabel={null} relatedVertical="hvac" />
      </div>
    );
  }
  return null;
}

export async function renderPlumbingElectricalNational(
  vertical: "plumbing" | "electrical",
  segment: string
): Promise<React.ReactNode | null> {
  const slug = `${vertical}/${segment}`.toLowerCase();
  const label = vertical === "plumbing" ? "Plumbing" : "Electrical";
  const hubHref = `/${vertical}`;

  const dbPillar = await getPageBySlug(slug);
  if (dbPillar != null && (dbPillar as { content_json?: unknown }).content_json != null) {
    return <RenderAuthority content={(dbPillar as { content_json: unknown }).content_json} vertical={vertical} />;
  }

  let page = await getIndexablePageBySlug(slug);
  if (!page) page = await getIndexablePageBySlug(segment);
  if (!page) page = await getIndexablePageBySlug(`diagnose/${segment}`);
  if (page) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 pt-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-hvac-blue">
            Home
          </Link>
          <span className="text-slate-300">/</span>
          <Link href={hubHref} className="hover:text-hvac-blue">
            {label}
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {(page as { title?: string | null }).title || segment.replace(/-/g, " ")}
          </span>
        </nav>
        <p className="mx-auto max-w-4xl px-4 pb-2 text-xs text-slate-500">
          Localized guides: pick a city from the{" "}
          <Link href={hubHref} className="text-hvac-blue hover:underline">
            {label} hub
          </Link>{" "}
          or append <span className="font-mono">/{`{city}`}</span> to this URL.
        </p>
        <div className="mx-auto max-w-4xl px-4">
          <DiagnosticVerticalNav vertical={vertical} pillarSlug={segment} citySlug={null} />
        </div>
        <DiagnosticPageView page={page as any} localLabel={null} relatedVertical={vertical} />
      </div>
    );
  }
  return null;
}

export async function renderPlumbingElectricalCity(
  vertical: "plumbing" | "electrical",
  symptom: string,
  city: string
): Promise<React.ReactNode | null> {
  const page = await getIndexablePageForLocalizedRoute(vertical, symptom, city);
  if (!page) return null;
  const localLabel = formatCityPathSegmentForDisplay(city);
  const relatedSlug = `${vertical}/${symptom}/${city}`.toLowerCase();
  return (
    <>
      <DiagnosticPageView
        page={page as any}
        localLabel={localLabel}
        relatedVertical={vertical}
        localizedChrome={{
          vertical,
          pillarSlug: symptom,
          citySlug: city,
          cityLabel: localLabel,
        }}
      />
      <RelatedPagesSection slug={relatedSlug} />
    </>
  );
}

export async function metadataForProgrammaticSegments(segments: string[]): Promise<Metadata | null> {
  const segs = segments.map((s) => s.toLowerCase());
  if (segs.length === 1) {
    const r = segs[0]!;
    if (r === "hvac") {
      return {
        title: "HVAC problems, organized | HVAC diagnostics",
        description:
          "Residential HVAC diagnostics: AC, heating, airflow, and controls. Pick a symptom pillar, then open localized Florida guides.",
        ...canonicalMetadata("/hvac"),
        robots: { index: true, follow: true },
      };
    }
    if (r === "plumbing") {
      return {
        title: "Plumbing diagnostics | Residential plumbing",
        description:
          "Structured plumbing guides for leaks, water heaters, drains, and pressure issues. Add your city for Florida context.",
        ...canonicalMetadata("/plumbing"),
        robots: { index: true, follow: true },
      };
    }
    if (r === "electrical") {
      return {
        title: "Electrical diagnostics | Power, breakers, and wiring",
        description:
          "Structured electrical guides for breaker trips, dead outlets, flickering lights, and panel issues. Add your city for Florida context.",
        ...canonicalMetadata("/electrical"),
        robots: { index: true, follow: true },
      };
    }
    return null;
  }
  if (segs.length < 2) return null;
  const root = segs[0]!;

  if (root === "hvac") {
    if (segs.length >= 3) {
      const tail = segs.slice(1);
      const raw = tail.join("/");
      const fullSlug = finalHvacLookupSlug(tail);
      if (!raw.trim()) return { title: "HVAC" };
      const page = await selectPageByFullSlugPath(fullSlug);
      if (!page) {
        const titlePart = (raw.split("/").filter(Boolean)[0] ?? raw).replace(/-/g, " ");
        const parts = raw.split("/").filter(Boolean);
        const citySeg = parts.length >= 2 ? parts[parts.length - 1] : "";
        const local = citySeg ? formatCityPathSegmentForDisplay(citySeg) : "";
        return {
          title: titlePart ? `${titlePart}${local ? ` in ${local}` : ""} | HVAC diagnostic` : "HVAC",
          description: `HVAC diagnostic guide for ${titlePart}${local ? ` in ${local}` : ""}.`,
          robots: { index: false, follow: true } as const,
        };
      }
      const title = String((page as { title?: string }).title ?? "").trim();
      const parts = raw.split("/").filter(Boolean);
      const citySeg = parts.length >= 2 ? parts[parts.length - 1] : "";
      const local = citySeg ? formatCityPathSegmentForDisplay(citySeg) : "";
      const titlePart = (parts[0] ?? raw).replace(/-/g, " ");
      return {
        title: title || (local ? `${titlePart} in ${local} | HVAC diagnostic` : `${titlePart} | HVAC diagnostic`),
        description: `HVAC diagnostic guide for ${titlePart}${local ? ` in ${local}` : ""}.`,
        alternates: { canonical: siteCanonicalUrl(fullSlug) },
        robots: { index: true, follow: true },
      };
    }
    const segment = segs[1]!;
    if (segment === "why-ac-isnt-cooling") {
      return {
        title: `${HVAC_PILLAR_WHY_AC_ISNT_COOLING_V3.title} | HVAC`,
        description: HVAC_PILLAR_WHY_AC_ISNT_COOLING_V3.summary_30s.slice(0, 160),
        ...canonicalMetadata("/hvac/why-ac-isnt-cooling"),
        robots: { index: true, follow: true },
      };
    }
    if (HVAC_SLUG_MAP[segment]) {
      const hub = getSystemHub(HVAC_SLUG_MAP[segment]);
      return {
        title: hub?.name ?? "HVAC",
        description: hub?.description ?? "HVAC system hub",
        ...canonicalMetadata(`/hvac/${segment}`),
      };
    }
    const titlePart = segment.replace(/-/g, " ");
    const storageSlug = `hvac/${segment}`.toLowerCase();
    const dbPillar = await getPageBySlug(storageSlug);
    if (dbPillar) {
      const title = String((dbPillar as { title?: string | null }).title ?? "").trim();
      return {
        title: title || `${titlePart} | HVAC diagnostic`,
        description: `National HVAC overview for ${titlePart}. Add a city segment for the localized guide.`,
        ...canonicalMetadata(`/hvac/${segment}`),
        robots: { index: true, follow: true },
      };
    }
    let page = await getIndexablePageBySlug(`hvac/${segment}`);
    if (!page) page = await getIndexablePageBySlug(segment);
    if (!page) page = await getIndexablePageBySlug(`diagnose/${segment}`);
    const title = page ? String((page as { title?: string | null }).title ?? "").trim() : "";
    if (isIndexableProblemPillar("hvac", segment)) {
      return {
        title: title || `${titlePart} | HVAC diagnostic`,
        description: `National HVAC overview for ${titlePart}. Add a city segment for the localized guide.`,
        ...canonicalMetadata(`/hvac/${segment}`),
        robots: { index: true, follow: true },
      };
    }
    return {
      title: title || `${titlePart} | HVAC diagnostic`,
      description: `National HVAC overview for ${titlePart}. Add a city segment for the localized guide.`,
      robots: { index: false, follow: true },
    };
  }

  if (root === "plumbing" || root === "electrical") {
    const vertical = root as "plumbing" | "electrical";
    const label = vertical === "plumbing" ? "Plumbing" : "Electrical";
    if (segs.length === 2) {
      const segment = segs[1]!;
      const titlePart = segment.replace(/-/g, " ");
      const pathname = `/${vertical}/${segment}`;
      const storageSlug = `${vertical}/${segment}`.toLowerCase();
      const dbPillar = await getPageBySlug(storageSlug);
      if (dbPillar) {
        const title = String((dbPillar as { title?: string | null }).title ?? "").trim();
        return {
          title: title || `${titlePart} | ${label} diagnostic`,
          description: `National ${label.toLowerCase()} overview for ${titlePart}. Pick a city for the localized guide.`,
          alternates: { canonical: siteCanonicalUrl(pathname) },
          robots: { index: true, follow: true },
        };
      }
      const indexable = isIndexableProblemPillar(vertical, segment);
      return {
        title: `${titlePart} | ${label} diagnostic`,
        description: `National ${label.toLowerCase()} overview for ${titlePart}. Pick a city for the localized guide.`,
        ...(indexable
          ? {
              alternates: { canonical: siteCanonicalUrl(pathname) },
              robots: { index: true, follow: true },
            }
          : { robots: { index: false, follow: true } }),
      };
    }
    if (segs.length === 3) {
      const symptom = segs[1]!;
      const city = segs[2]!;
      const local = formatCityPathSegmentForDisplay(city);
      const titlePart = symptom.replace(/-/g, " ");
      const page = await getIndexablePageForLocalizedRoute(vertical, symptom, city);
      const strict = robotsForDbBackedPage(
        page as { status?: unknown; updated_at?: unknown } | null,
        Boolean(page) && isLocalizedTradeTripletEligibleForIndexingRobots(page as { slug?: unknown }),
      );
      const pathname = `/${vertical}/${symptom}/${city}`;
      return {
        title: `${titlePart} in ${local} | ${label} diagnostic`,
        description: `Localized ${label.toLowerCase()} diagnostic guide for ${titlePart} in ${local}.`,
        alternates: { canonical: siteCanonicalUrl(pathname) },
        ...(strict ?? { robots: { index: true, follow: true } }),
      };
    }
  }

  return null;
}

export async function renderProgrammaticPage(segments: string[]): Promise<React.ReactNode | null> {
  const segs = segments.map((s) => s.trim()).filter(Boolean);
  if (segs.length === 1) {
    const r = segs[0]!.toLowerCase();
    if (r === "hvac") return <HvacTradeHubPage />;
    if (r === "plumbing") return <PlumbingTradeHubPage />;
    if (r === "electrical") return <ElectricalTradeHubPage />;
    return null;
  }
  if (segs.length < 2) return null;
  const root = segs[0]!.toLowerCase();

  if (root === "hvac") {
    if (segs.length >= 3) {
      return renderHvacDeepAuthority(segs.slice(1));
    }
    const two = await renderHvacTwoSegment(segs[1]!);
    return two;
  }

  if (root === "plumbing") {
    if (segs.length === 2) return renderPlumbingElectricalNational("plumbing", segs[1]!);
    if (segs.length === 3) return renderPlumbingElectricalCity("plumbing", segs[1]!, segs[2]!);
    return null;
  }

  if (root === "electrical") {
    if (segs.length === 2) return renderPlumbingElectricalNational("electrical", segs[1]!);
    if (segs.length === 3) return renderPlumbingElectricalCity("electrical", segs[1]!, segs[2]!);
    return null;
  }

  return null;
}
