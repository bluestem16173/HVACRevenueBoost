import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getIndexablePageForDiagnoseJoinedSlug } from "@/lib/get-indexable-page";
import { formatCityPathSegmentForDisplay } from "@/lib/localized-city-path";
import { strictRobotsForDbPage } from "@/lib/seo/strict-indexing";
import { renderHsdV25 } from "@/src/lib/hsd/renderHsdV25";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const dynamicParams = true;

type CatchAllParams = { slug?: string[] };

function parseContentJson(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
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

async function loadHsdPageRow(joinedUnderHvac: string) {
  const storageSlug = joinedUnderHvac.startsWith("hvac/")
    ? joinedUnderHvac
    : `hvac/${joinedUnderHvac}`;
  return getIndexablePageForDiagnoseJoinedSlug(storageSlug);
}

export async function generateMetadata({
  params,
}: {
  params: CatchAllParams | Promise<CatchAllParams>;
}): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const join = (resolved.slug ?? []).filter(Boolean).join("/");
  if (!join) {
    return { title: "HVAC" };
  }
  const page = await loadHsdPageRow(join);
  const strict = strictRobotsForDbPage(Boolean(page), page?.updated_at);
  const title = page ? String((page as { title?: string }).title ?? "").trim() : "";
  const parts = join.split("/").filter(Boolean);
  const citySeg = parts.length >= 2 ? parts[parts.length - 1] : "";
  const local = citySeg ? formatCityPathSegmentForDisplay(citySeg) : "";
  const titlePart = (parts[0] ?? join).replace(/-/g, " ");
  return {
    title: title || (local ? `${titlePart} in ${local} | HVAC diagnostic` : `${titlePart} | HVAC diagnostic`),
    description: `HVAC diagnostic guide for ${titlePart}${local ? ` in ${local}` : ""}.`,
    ...(strict ?? {}),
  };
}

export default async function Page({
  params,
}: {
  params: CatchAllParams | Promise<CatchAllParams>;
}) {
  const resolved = await Promise.resolve(params);
  const join = (resolved.slug ?? []).filter(Boolean).join("/");
  if (!join) {
    notFound();
  }

  const page = await loadHsdPageRow(join);
  if (!page) {
    notFound();
  }

  const parsed = parseContentJson((page as { content_json?: unknown }).content_json);
  if (!parsed) {
    notFound();
  }

  const html = renderHsdV25({ ...parsed, vertical: "hvac" });

  return <div className="hsd-v25-root min-h-screen bg-white dark:bg-slate-950" dangerouslySetInnerHTML={{ __html: html }} />;
}
