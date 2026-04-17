function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function escapeMermaidLabel(text: string): string {
  return text.replace(/"/g, "'").replace(/\|/g, "/").replace(/[[\]]/g, " ").trim();
}

/**
 * Builds `flowchart TD` source from structured `diagnostic_flow` { nodes, edges }.
 * Returns null if there is nothing to draw.
 */
export function diagnosticFlowJsonToMermaid(flow: unknown): string | null {
  const f = asRecord(flow);
  if (!f) return null;
  const nodesRaw = Array.isArray(f.nodes) ? f.nodes : [];
  const edgesRaw = Array.isArray(f.edges) ? f.edges : [];
  if (nodesRaw.length === 0 && edgesRaw.length === 0) return null;

  const rawIdToMermaidId = new Map<string, string>();
  nodesRaw.forEach((n, i) => {
    const r = asRecord(n);
    const raw = asString(r?.id) || `node_${i}`;
    rawIdToMermaidId.set(raw, `DG${i}`);
  });

  const lines: string[] = ["flowchart TD"];

  nodesRaw.forEach((n, i) => {
    const r = asRecord(n);
    const raw = asString(r?.id) || `node_${i}`;
    const mid = rawIdToMermaidId.get(raw) || `DG${i}`;
    const label = escapeMermaidLabel(asString(r?.label) || raw);
    lines.push(`  ${mid}["${label}"]`);
  });

  edgesRaw.forEach((e) => {
    const r = asRecord(e);
    const fromRaw = asString(r?.from);
    const toRaw = asString(r?.to);
    const from = rawIdToMermaidId.get(fromRaw);
    const to = rawIdToMermaidId.get(toRaw);
    if (!from || !to) return;
    const edgeLabel = asString(r?.label);
    if (edgeLabel) {
      lines.push(`  ${from} -->|${escapeMermaidLabel(edgeLabel)}| ${to}`);
    } else {
      lines.push(`  ${from} --> ${to}`);
    }
  });

  return lines.join("\n");
}

/**
 * Resolves `diagnostic_flow` for Mermaid: raw diagram string (dg_authority_v2 lock)
 * or structured `{ nodes, edges }` (legacy / tooling).
 */
export function diagnosticFlowToMermaidSource(flow: unknown): string | null {
  if (typeof flow === "string") {
    const s = flow.trim();
    return s.length > 0 ? s : null;
  }
  return diagnosticFlowJsonToMermaid(flow);
}

