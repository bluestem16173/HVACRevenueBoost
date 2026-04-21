import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  metadataForProgrammaticSegments,
  renderProgrammaticPage,
} from "@/lib/programmatic-pages/catchAllDbRoutes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const dynamicParams = true;

type CatchAllParams = { slug?: string[] };

async function resolveParams(params: CatchAllParams | Promise<CatchAllParams>): Promise<CatchAllParams> {
  return Promise.resolve(params);
}

function slugSegments(params: CatchAllParams): string[] {
  return params.slug?.map((p) => String(p ?? "").trim()).filter(Boolean) ?? [];
}

export async function generateMetadata({
  params,
}: {
  params: CatchAllParams | Promise<CatchAllParams>;
}): Promise<Metadata> {
  const resolved = await resolveParams(params);
  const segs = slugSegments(resolved);
  const meta = await metadataForProgrammaticSegments(segs);
  if (!meta) {
    notFound();
  }
  return meta;
}

export default async function ProgrammaticCatchAllPage({
  params,
}: {
  params: CatchAllParams | Promise<CatchAllParams>;
}) {
  const resolved = await resolveParams(params);
  const segs = slugSegments(resolved);
  if (segs.length < 2) {
    notFound();
  }
  const node = await renderProgrammaticPage(segs);
  if (node === null) {
    notFound();
  }
  return node;
}
