import type { HsdV25Payload } from "@/lib/validation/hsdV25Schema";

/** Largest dollar amount parsed from strings like "$1,500", "$3k+", "$2200–$9500". */
function maxParsedUsdInText(s: string): number {
  let max = 0;
  const re = /\$\s*([\d,]+(?:\.\d+)?)\s*(k)?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    let n = parseFloat(String(m[1]).replace(/,/g, ""));
    if (!Number.isFinite(n)) continue;
    if (m[2] && m[2].toLowerCase() === "k") n *= 1000;
    if (n > max) max = n;
  }
  return max;
}

/** Extra invariants beyond Zod (explicit failures for workers / publish gates). */
export function assertHsdV25ContentRules(page: HsdV25Payload): void {
  if (!page.repair_matrix?.length) throw new Error("No repair matrix");

  const hasHighCost = page.repair_matrix.some((r) => r.cost_max >= 1500);
  if (!hasHighCost) {
    throw new Error("repair_matrix missing high-cost scenario");
  }

  const stopNow = page.decision?.stop_now ?? [];
  if (stopNow.length < 2) {
    throw new Error("Missing stop_now conditions");
  }
  const hasCriticalLanguage = stopNow.some((item) =>
    /grinding|burning|smoke|shut off|immediately/i.test(item)
  );
  if (!hasCriticalLanguage) {
    throw new Error("stop_now lacks critical urgency language");
  }

  if (!page.summary_30s?.risk_warning.includes("$")) throw new Error("No cost risk");

  const flow = page.diagnostic_flow;
  if (!flow.nodes || flow.nodes.length < 4) {
    throw new Error("Weak diagnostic_flow: not enough nodes");
  }
  if (!flow.edges || flow.edges.length < 3) {
    throw new Error("Weak diagnostic_flow: not enough edges");
  }

  const escBlob = page.cost_escalation.map((e) => `${e.stage} ${e.description} ${e.cost}`).join(" ");
  if (maxParsedUsdInText(escBlob) < 1500) {
    throw new Error("cost_escalation must reach a $1,500+ scenario (include dollar amounts in stage/description/cost)");
  }
}
