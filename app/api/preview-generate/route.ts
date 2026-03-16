import { NextResponse } from "next/server";
import { getSymptomWithCausesFromDB, getCauseDetails } from "@/lib/diagnostic-engine";
import { SYMPTOMS } from "@/data/knowledge-graph";

/** Preview generation — returns content without saving to DB */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") || "ac-blowing-warm-air";

  try {
    const { generatePageContent, renderToHtml } = await import("@/lib/ai-generator");
    const symptomSlug = slug.replace(/^diagnose\//, "").replace(/^diagnose-/, "");
    const pageTitle = symptomSlug.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
    const pageSlug = `diagnose/${symptomSlug}`;

    let graphSymptom = await getSymptomWithCausesFromDB(symptomSlug);
    if (!graphSymptom) {
      const staticSymptom = SYMPTOMS.find((s) => s.id === symptomSlug);
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

    const aiData = await generatePageContent(pageSlug, "symptom", pageTitle, {
      graphSymptom: graphSymptom || undefined,
    });
    const html = renderToHtml(aiData);

    return NextResponse.json({
      ok: true,
      slug: pageSlug,
      aiData,
      html,
    });
  } catch (e: any) {
    console.error("[preview-generate]", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Generation failed" },
      { status: 500 }
    );
  }
}
