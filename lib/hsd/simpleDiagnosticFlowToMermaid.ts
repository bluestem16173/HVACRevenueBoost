/**
 * Turn AI `diagnostic_flow` { nodes: [{id,label}], edges: [{from,to,label?}] }
 * into Mermaid `flowchart TD` for {@link HsdLockedPageWithMermaid}.
 */

function asObj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

/** Keep Mermaid + HTML wrapper safe when embedding in a `<div class="mermaid">`. */
function mermaidText(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "'");
}

function sanitizeMermaidId(raw: string, idx: number): string {
  let s = String(raw || "").replace(/[^a-zA-Z0-9_]/g, "_");
  if (!s) s = `n${idx}`;
  if (/^[0-9]/.test(s)) s = `n_${s}`;
  return s;
}

/** @returns Mermaid source or empty string if graph is unusable. */
export function simpleDiagnosticFlowToMermaid(flow: unknown): string {
  const f = asObj(flow);
  if (!f) return "";
  const rawNodes = Array.isArray(f.nodes) ? f.nodes : [];
  const rawEdges = Array.isArray(f.edges) ? f.edges : [];
  if (rawNodes.length < 3 || rawEdges.length < 2) return "";

  const idMap = new Map<string, string>();
  rawNodes.forEach((n, i) => {
    const o = asObj(n);
    const orig = String(o?.id ?? "").trim();
    if (!orig) return;
    idMap.set(orig, sanitizeMermaidId(orig, i));
  });

  if (idMap.size < 3) return "";

  const lines: string[] = ["flowchart TD"];
  for (const n of rawNodes) {
    const o = asObj(n);
    if (!o) continue;
    const orig = String(o.id ?? "").trim();
    const id = idMap.get(orig);
    if (!id) continue;
    const lab = mermaidText(
      String(o.label ?? orig)
        .replace(/[[\]]/g, " ")
        .replace(/\r?\n/g, " ")
        .trim()
        .slice(0, 96) || id
    );
    lines.push(`${id}["${lab}"]`);
  }

  for (const e of rawEdges) {
    const o = asObj(e);
    if (!o) continue;
    const fromOrig = String(o.from ?? "").trim();
    const toOrig = String(o.to ?? "").trim();
    const from = idMap.get(fromOrig) ?? sanitizeMermaidId(fromOrig, 0);
    const to = idMap.get(toOrig) ?? sanitizeMermaidId(toOrig, 0);
    const rawEdgeLab = String(o.label ?? "")
      .replace(/[[\]]/g, " ")
      .replace(/\r?\n/g, " ")
      .trim()
      .slice(0, 48);
    const lab = rawEdgeLab ? mermaidText(rawEdgeLab) : "";
    if (lab) lines.push(`${from} -->|"${lab}"| ${to}`);
    else lines.push(`${from} --> ${to}`);
  }

  return lines.join("\n");
}
