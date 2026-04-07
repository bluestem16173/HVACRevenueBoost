import { getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { inferDiagnosticSchemaVersion } from "@/lib/infer-diagnostic-schema";
import { normalizeDiagnosticToDisplayModel } from "@/lib/normalize-diagnostic-display";
import { normalizeContent } from "@/lib/normalize-content";
import GoldStandardPage from "@/components/gold/GoldStandardPage";
import DiagnosticGoldPage from "@/components/diagnostic/DiagnosticGoldPage";
import AuthoritySymptomPage from "@/components/authority/AuthoritySymptomPage";
import DgAuthorityV2Page from "@/components/authority/DgAuthorityV2Page";
import MasterDecisionGridPage from "@/components/decisiongrid/MasterDecisionGridPage";
import DiagnosticModal from "@/components/DiagnosticModal";
import { normalizePageData } from "@/lib/content";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import sql from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Soft Retry Proxy to handle Neon DB replica lag and race conditions.
 * Shields freshly generated pages from instantly 404ing while waiting for replica sync.
 */
async function getPageWithRetry(symptom: string, retries = 2) {
  const bare = symptom.replace(/^diagnose\//, "");
  const prefixed = `diagnose/${bare}`;

  for (let i = 0; i <= retries; i++) {
    const aiPage =
      (await getDiagnosticPageFromDB(symptom, "hvac_authority_v3")) ??
      (await getDiagnosticPageFromDB(symptom, "hvac_authority_v2")) ??
      (await getDiagnosticPageFromDB(symptom, "dg_authority_v2")) ??
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
  let query;
  try {
    const res = await fetch(process.env.NEON_HTTP_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "SELECT * FROM pages WHERE slug = $1 LIMIT 1",
        params: [params.symptom]
      })
    });
    const json = await res.json();
    // Accommodate standard DB data shapes
    query = json.rows || json.data || json || [];
  } catch (e) {
    return {};
  }

  if (!query || query.length === 0) {
    return {};
  }
  
  const page = query[0];

  if (page?.quality_status === "noindex") {
    return { robots: { index: false, follow: true } };
  }
  return {};
}

function buildHtml(title: string) {
  return `
    <div style="
    position:sticky;
    top:0;
    z-index:999;
    background:#dc2626;
    color:white;
    padding:12px;
    text-align:center;
    font-weight:bold;
    ">
      🚨 AC Issue? Don’t Risk a $2,000 Repair — 
      <button onclick="openLeadCard()" style="
        margin-left:10px;
        padding:8px 14px;
        background:white;
        color:#dc2626;
        border:none;
        border-radius:6px;
        font-weight:bold;
        cursor:pointer;
      ">
        Get Help Now
      </button>
    </div>

    <script>
      function openLeadCard() {
        window.dispatchEvent(new CustomEvent("open-leadcard"));
      }
    </script>

    <h1>${title} – Causes, Fixes, and What To Do</h1>

    <p style="background:#fef3c7;padding:12px;border-radius:6px;">
      <strong>Quick Answer:</strong> This HVAC issue is usually caused by airflow restrictions, system imbalance, or failing components.
    </p>

    <!-- 🔥 IMMEDIATE CTA -->
    <div style="margin:16px 0;">
      <button onclick="openLeadCard()" style="
      padding:14px 24px;
      background:#dc2626;
      color:white;
      border:none;
      border-radius:8px;
      font-weight:bold;
      font-size:16px;
      cursor:pointer;
      ">
      🚨 Get Immediate HVAC Help
      </button>
    </div>

    <h2>What’s Happening</h2>
    <p>Your HVAC system is not operating efficiently. In Florida heat and humidity, this problem can escalate quickly and lead to higher costs or system damage.</p>

    <h2>Most Common Causes</h2>
    <ul>
      <li><strong>Dirty air filter:</strong> Blocks airflow and reduces efficiency</li>
      <li><strong>Low refrigerant:</strong> Reduces cooling capacity</li>
      <li><strong>Thermostat issues:</strong> Sends incorrect signals</li>
    </ul>

    <h2>What You Can Check First</h2>
    <ul>
      <li>Replace air filter</li>
      <li>Check thermostat settings</li>
      <li>Ensure vents are open and unobstructed</li>
    </ul>

    <h2>Why This Gets Worse</h2>
    <ul>
      <li>Higher energy bills</li>
      <li>System overworking</li>
      <li>Component damage</li>
    </ul>

    <!-- 🔥 STRONG CTA -->
    <div style="margin-top:20px;padding:16px;background:#fee2e2;border-radius:8px;">
      <h3>Don’t Wait — This Can Get Expensive Fast</h3>
      <p>Florida heat makes HVAC issues worse quickly. A technician can diagnose and fix this before it turns into a major repair.</p>
      <button onclick="openLeadCard()" style="
      padding:14px 24px;
      background:#dc2626;
      color:white;
      border:none;
      border-radius:8px;
      font-weight:bold;
      font-size:16px;
      cursor:pointer;
      ">
      🚨 Get Immediate HVAC Help
      </button>
    </div>
  `;
}

export default async function SymptomPage({
  params,
}: {
  params: { symptom: string };
}) {
  let query;
  try {
    const res = await fetch(process.env.NEON_HTTP_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "SELECT * FROM pages WHERE slug = $1 LIMIT 1",
        params: [params.symptom]
      }),
      cache: "no-store"
    });
    const json = await res.json();
    query = json.rows || json.data || json || [];
  } catch (err) {
    return <div>Database Connection Error</div>;
  }

  if (!query || query.length === 0) {
    return <div>Page not found</div>;
  }
  
  const page = query[0];

  const html =
    page.content_html ||
    (typeof page.content === "string" ? page.content : null);

  if (html) {
    return (
      <main style={{ padding: 24, paddingBottom: 60 }}>
        <DiagnosticModal />
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </main>
    );
  }

  if (page.content_json) {
    const title = params.symptom.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    const finalHtml = buildHtml(title);

    return (
      <main style={{ padding: 24, paddingBottom: 60 }}>
        <DiagnosticModal />
        <div dangerouslySetInnerHTML={{ __html: finalHtml }} />
      </main>
    );
  }

  return <div>Empty page</div>;
}
