import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSymptomWithCausesFromDB, getCauseDetails } from "@/lib/diagnostic-engine";
import { SYMPTOMS } from "@/data/knowledge-graph";
import { normalizeToBaseSlug, buildSlug } from "@/lib/slug-helpers";

/** Generate and save page to DB. Call after preview is approved. */
export async function POST(req: Request) {
  try {
    const { generatePageContent, renderToHtml } = await import("@/lib/ai-generator");
    const body = await req.json();
    const proposed_slug = body.slug || "ac-blowing-warm-air";
    const page_type = body.page_type || "symptom";

    const baseSlug = normalizeToBaseSlug(proposed_slug);
    const fullSlug = buildSlug(baseSlug, page_type);

    console.log({ baseSlug, fullSlug, pageType: page_type });

    const pageTitle = baseSlug.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());

    let graphSymptom = await getSymptomWithCausesFromDB(baseSlug);
    if (!graphSymptom) {
      const staticSymptom = SYMPTOMS.find((s) => s.id === baseSlug);
      if (staticSymptom?.causes?.length) {
        graphSymptom = {
          id: staticSymptom.id,
          name: staticSymptom.name,
          slug: staticSymptom.id,
          description: staticSymptom.description,
          causes: staticSymptom.causes.map((cId) => getCauseDetails(cId)).filter(Boolean),
        } as any;
      }
    }

    const aiData = await generatePageContent(`diagnose/${baseSlug}`, page_type, pageTitle, {
      graphSymptom: graphSymptom || undefined,
    });
    const html = renderToHtml(aiData);

    const contentJson = {
      ...aiData,
      html_content: html,
      engine_version: "5.0.0-HVACRevenueBoost-PreviewSave",
      generated_at: new Date().toISOString(),
    };

    const result = await sql`
      INSERT INTO pages (slug, title, page_type, content)
      VALUES (${fullSlug}, ${pageTitle}, ${page_type}, ${JSON.stringify(contentJson)}::jsonb)
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content
      RETURNING id, slug
    `;

    const row = result[0] as { id: number; slug: string } | undefined;
    return NextResponse.json({
      ok: true,
      id: row?.id,
      slug: row?.slug,
    });
  } catch (e: any) {
    console.error("[generate-save]", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Save failed" },
      { status: 500 }
    );
  }
}
