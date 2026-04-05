/**
 * Diagnose symptom route — no “strict lock” 404s:
 * Drift (wrong schema, bad JSON, unknown page_type) renders visible debug — never a blank 404.
 * Missing DB row: inline message + slug (still no 404). Content: normalize once, then branch.
 */
import { getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { inferDiagnosticSchemaVersion } from "@/lib/infer-diagnostic-schema";
import { normalizeDiagnosticToDisplayModel } from "@/lib/normalize-diagnostic-display";
import { normalizeContent } from "@/lib/normalize-content";
import GoldStandardPage from "@/components/gold/GoldStandardPage";
import DiagnosticGoldPage from "@/components/diagnostic/DiagnosticGoldPage";
import AuthoritySymptomPage from "@/components/authority/AuthoritySymptomPage";
import MasterDecisionGridPage from "@/components/decisiongrid/MasterDecisionGridPage";
import { normalizePageData } from "@/lib/content";
import { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Amber JSON footer — dev-only unless NEXT_PUBLIC_DIAGNOSE_DEBUG=1 */
function showDiagnoseDebugFooter(): boolean {
  return (
    process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DIAGNOSE_DEBUG === "1"
  );
}

/**
 * Soft Retry Proxy to handle Neon DB replica lag and race conditions.
 * Shields freshly generated pages from instantly 404ing while waiting for replica sync.
 */
async function getPageWithRetry(symptom: string, retries = 2) {
  const bare = symptom.replace(/^diagnose\//, "");
  const prefixed = `diagnose/${bare}`;

  for (let i = 0; i <= retries; i++) {
    const aiPage =
      (await getDiagnosticPageFromDB(symptom, "diagnose")) ??
      (await getDiagnosticPageFromDB(symptom, "symptom")) ??
      (await getDiagnosticPageFromDB(prefixed, "symptom")) ??
      (await getDiagnosticPageFromDB(prefixed, "diagnose")) ??
      (await getDiagnosticPageFromDB(symptom, "condition")) ??
      (await getDiagnosticPageFromDB(symptom, "system"));

    if (aiPage) {
      return aiPage;
    }

    await new Promise((r) => setTimeout(r, 150));
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: { symptom: string };
}): Promise<Metadata> {
  const aiPage = await getPageWithRetry(params.symptom);
  if (aiPage?.quality_status === "noindex") {
    return { robots: { index: false, follow: true } };
  }
  return {};
}

function DebugFooter({ meta }: { meta: Record<string, unknown> }) {
  return (
    <pre className="mx-auto mt-8 max-w-4xl whitespace-pre-wrap break-words rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-slate-800">
      {JSON.stringify(meta, null, 2)}
    </pre>
  );
}

export default async function SymptomPage({
  params,
}: {
  params: { symptom: string };
}) {
  const aiPage = await getPageWithRetry(params.symptom);

  const debugMeta = {
    slug: params.symptom,
    page_type: aiPage?.page_type,
    schema: aiPage?.schema_version,
    quality: aiPage?.quality_status,
  };

  if (!aiPage) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-slate-600">
        ❌ No page found: {params.symptom}
      </div>
    );
  }

  const row = aiPage as { schema_version?: string; content_json?: unknown; data?: unknown };
  const pageContent = row.content_json ?? row.data;

  /** Parse first (handles JSON string from DB), then infer schema — infer on raw string always fails. */
  let content = normalizeContent(pageContent, "", { slug: params.symptom });

  const schema =
    (typeof row.schema_version === "string" && row.schema_version.trim() !== ""
      ? row.schema_version
      : null) ??
    inferDiagnosticSchemaVersion(content) ??
    "";

  const debugMetaResolved = { ...debugMeta, schema_resolved: schema };

  if (schema === "v2_goldstandard" && content && typeof content === "object") {
    content = {
      ...(content as Record<string, unknown>),
      schemaVersion: "v1",
      slug: params.symptom,
    };
  }

  if (schema === "authority_symptom" && content && typeof content === "object") {
    return (
      <>
        <AuthoritySymptomPage content={content as Record<string, unknown>} />
        {showDiagnoseDebugFooter() ? <DebugFooter meta={debugMetaResolved} /> : null}
      </>
    );
  }

  if (schema === "decisiongrid_master" && content && typeof content === "object") {
    const c = content as Record<string, unknown>;
    const slug = typeof c.slug === "string" && c.slug.trim() ? c.slug : params.symptom;
    const title =
      typeof c.title === "string" && c.title.trim() ? c.title : params.symptom.replace(/-/g, " ");
    const pageViewModel = normalizePageData({
      rawContent: c,
      pageType: "symptom",
      slug,
      title,
    });
    return (
      <>
        <MasterDecisionGridPage pageViewModel={pageViewModel} rawContent={c} />
        {showDiagnoseDebugFooter() ? <DebugFooter meta={debugMetaResolved} /> : null}
      </>
    );
  }

  // Removed custom DecisionGridV2Page intercept. 
  // All payloads conforming to the schema will correctly hit the pre-existing renderers.

  // Fallback for older existing objects tagged v5_master
  if (schema === "v5_master" || schema === "v6_dg_hvac_hybrid") {
    if (!content) {
      return (
        <div className="mx-auto max-w-4xl p-6 text-slate-600">
          ⚠️ Invalid v5 content {JSON.stringify(debugMetaResolved)}
        </div>
      );
    }

    const display = normalizeDiagnosticToDisplayModel(content as Record<string, unknown>, {
      routeSlug: params.symptom,
    });

    return (
      <>
        <DiagnosticGoldPage display={display} routeSlug={params.symptom} />
        {showDiagnoseDebugFooter() ? <DebugFooter meta={debugMetaResolved} /> : null}
      </>
    );
  }

  // Legacy v2 checks remain here for continuity
  if (schema === "v2_goldstandard") {
    if (!content || typeof content !== "object") {
      return (
        <div className="mx-auto max-w-4xl p-6 text-slate-600">
          ⚠️ Invalid v2 content {JSON.stringify(debugMetaResolved)}
        </div>
      );
    }

    const normalized = {
      ...(content as Record<string, unknown>),
      schemaVersion: "v1",
      slug: params.symptom,
    };

    return (
      <>
        <GoldStandardPage data={normalized} />
        {showDiagnoseDebugFooter() ? <DebugFooter meta={debugMetaResolved} /> : null}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 text-slate-600">
      ⚠️ Unknown schema: {String(schema || "(missing)")}
      {showDiagnoseDebugFooter() ? <DebugFooter meta={debugMetaResolved} /> : null}
    </div>
  );
}
