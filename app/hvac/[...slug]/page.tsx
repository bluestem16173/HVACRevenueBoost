import type { Metadata } from "next";
import { notFound } from "next/navigation";

import sql from "@/lib/db";
import {
  canonicalPagesSlugPathKeys,
  normalizeCatchAllParamsSlugPath,
} from "@/lib/slug-utils";
import {
  formatCityPathSegmentForDisplay,
  joinedSlugEndsWithCityStorage,
  type ServiceVertical,
} from "@/lib/localized-city-path";
import { siteCanonicalUrl } from "@/lib/seo/canonical";
import { RenderAuthority } from "@/components/RenderAuthority";
import { HvacAuthorityLoopNav } from "@/components/homeservice/HvacAuthorityLoopNav";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const dynamicParams = true;

type CatchAllParams = { slug?: string[]; vertical?: ServiceVertical };

/** Default when this segment is not passed on `params` (this tree is always HVAC). */
const VERTICAL: ServiceVertical = "hvac";

/**
 * URL path for `pages` lookup: always **`/hvac/...`** (leading slash, collapsed slashes, no trailing slash).
 * Uses {@link normalizeCatchAllParamsSlugPath} for catch-all segments so storage matches `slug-utils` rules.
 */
function finalLookupSlug(params: CatchAllParams): string {
  const vertical = params.vertical ?? VERTICAL;
  const raw = params.slug?.join("/") || "";
  const fromSegments = normalizeCatchAllParamsSlugPath(params.slug);
  const tentative =
    fromSegments ?? `/${vertical}/${raw}`.replace(/\/+/g, "/").replace(/\/$/, "");
  const { withLeading } = canonicalPagesSlugPathKeys(tentative);
  console.log("FINAL LOOKUP:", withLeading);
  return withLeading;
}

function parseContentJson(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return Object.keys(raw as object).length > 0 ? (raw as Record<string, unknown>) : null;
  }
  if (typeof raw === "string") {
    try {
      const o = JSON.parse(raw) as unknown;
      return o && typeof o === "object" && !Array.isArray(o) ? (o as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return null;
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

async function resolveParams(params: CatchAllParams | Promise<CatchAllParams>): Promise<CatchAllParams> {
  return Promise.resolve(params);
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

export async function generateMetadata({
  params,
}: {
  params: CatchAllParams | Promise<CatchAllParams>;
}): Promise<Metadata> {
  const resolved = await resolveParams(params);
  const raw = resolved.slug?.join("/") || "";
  const fullSlug = finalLookupSlug(resolved);
  if (!raw.trim()) {
    return { title: "HVAC" };
  }
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
  const pathname = fullSlug;

  return {
    title: title || (local ? `${titlePart} in ${local} | HVAC diagnostic` : `${titlePart} | HVAC diagnostic`),
    description: `HVAC diagnostic guide for ${titlePart}${local ? ` in ${local}` : ""}.`,
    alternates: { canonical: siteCanonicalUrl(pathname) },
    robots: { index: true, follow: true },
  };
}

export default async function Page({
  params,
}: {
  params: CatchAllParams | Promise<CatchAllParams>;
}) {
  const resolved = await resolveParams(params);
  const raw = resolved.slug?.join("/") || "";
  const fullSlug = finalLookupSlug(resolved);

  if (!raw.trim()) {
    notFound();
  }

  const row = await selectPageByFullSlugPath(fullSlug);

  if (!row) {
    return <div>Missing slug: {fullSlug}</div>;
  }

  if (!hasRenderableBody(row)) {
    return <div>Page not generated yet: {fullSlug}</div>;
  }

  const parts = raw.split("/").filter(Boolean);
  const symptom = String(parts[0] ?? "").trim().toLowerCase();
  const isCityPage = joinedSlugEndsWithCityStorage(raw);
  const citySeg = isCityPage && parts.length >= 2 ? String(parts[parts.length - 1] ?? "").toLowerCase() : "";

  if (row.content_json) {
    return (
      <>
        {isCityPage && symptom ? (
          <HvacAuthorityLoopNav variant="city" symptom={symptom} citySlug={citySeg || null} />
        ) : null}
        <RenderAuthority content={row.content_json} vertical={VERTICAL} />
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
      </>
    );
  }

  return (
    <>
      {isCityPage && symptom ? (
        <HvacAuthorityLoopNav variant="city" symptom={symptom} citySlug={citySeg || null} />
      ) : null}
      <div className="p-6 text-slate-600">No renderable content_json or content_html.</div>
    </>
  );
}
