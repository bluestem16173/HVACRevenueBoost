import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getIndexablePageForDiagnoseJoinedSlug } from "@/lib/get-indexable-page";
import { joinedSlugEndsWithCityStorage } from "@/lib/localized-city-path";
import { siteCanonicalUrl } from "@/lib/seo/canonical";
import { robotsForDbBackedPage } from "@/lib/seo/strict-indexing";
import { isLocalizedTradeTripletEligibleForIndexingRobots } from "@/lib/seo/tier-one-discovery";
import { renderHsdV25 } from "@/lib/hsd/renderHsdV25";

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

function verticalFromStorageSlug(slug: string): string {
  const first = slug.split("/").filter(Boolean)[0]?.trim().toLowerCase() ?? "";
  if (first === "hvac" || first === "plumbing" || first === "electrical") return first;
  return "hvac";
}

export async function generateMetadata({
  params,
}: {
  params: CatchAllParams | Promise<CatchAllParams>;
}): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const join = (resolved.slug ?? []).filter(Boolean).join("/");
  if (!join) {
    return { title: "Diagnose" };
  }

  const page = await getIndexablePageForDiagnoseJoinedSlug(join);
  const storageSlug = page ? String((page as { slug?: string }).slug ?? join).trim() : "";
  const isCityPage =
    joinedSlugEndsWithCityStorage(join) || (Boolean(storageSlug) && joinedSlugEndsWithCityStorage(storageSlug));

  const strict = robotsForDbBackedPage(
    page as { status?: unknown; updated_at?: unknown } | null,
    Boolean(page) && isLocalizedTradeTripletEligibleForIndexingRobots(page as { slug?: unknown }),
  );

  const pathname = `/diagnose/${join}`;

  if (!isCityPage) {
    return {
      title: "Diagnostic guide",
      robots: { index: false, follow: true },
    };
  }

  return {
    title: page ? String((page as { title?: string }).title ?? "").trim() || "Diagnostic guide" : "Diagnostic guide",
    alternates: { canonical: siteCanonicalUrl(pathname) },
    ...(strict ?? { robots: { index: true, follow: true } }),
  };
}

export default async function Page({
  params,
}: {
  params: CatchAllParams | Promise<CatchAllParams>;
}) {
  const resolved = await Promise.resolve(params);
  const slug = (resolved.slug ?? []).filter(Boolean).join("/");
  if (!slug) notFound();

  const page = await getIndexablePageForDiagnoseJoinedSlug(slug);
  const pageType = String((page as { page_type?: string }).page_type ?? "").trim();
  /** `generateHsdPage` persists `city_symptom`; older rows may use `hsd`. */
  if (!page || (pageType !== "hsd" && pageType !== "city_symptom")) {
    notFound();
  }

  const parsed = parseContentJson((page as { content_json?: unknown }).content_json);
  if (!parsed) notFound();

  const storageSlug = String((page as { slug?: string }).slug ?? slug).trim();
  const vertical = verticalFromStorageSlug(storageSlug);

  const html = renderHsdV25({ ...parsed, vertical });

  return (
    <div className="hsd-v25-root min-h-screen bg-white dark:bg-slate-950" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
