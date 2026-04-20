import { notFound } from "next/navigation";

import { getIndexablePageForDiagnoseJoinedSlug } from "@/lib/get-indexable-page";
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

export default async function Page({
  params,
}: {
  params: CatchAllParams | Promise<CatchAllParams>;
}) {
  const resolved = await Promise.resolve(params);
  const slug = (resolved.slug ?? []).filter(Boolean).join("/");
  if (!slug) notFound();

  const page = await getIndexablePageForDiagnoseJoinedSlug(slug);
  if (!page || String((page as { page_type?: string }).page_type ?? "") !== "hsd") {
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
