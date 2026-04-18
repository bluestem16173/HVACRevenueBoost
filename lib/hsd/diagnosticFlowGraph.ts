/** Structured decision graph stored in `pages.content_json.diagnostic_flow` (no raw Mermaid in JSON). */

export type HsdFlowNodeKind = "start" | "decision" | "outcome";

export type HsdFlowNode = {
  id: string;
  kind: HsdFlowNodeKind;
  label: string;
  /** Maps to Mermaid `:::class` for click targets (HVAC only). */
  styleClass?: "airflow" | "refrigerant" | "load" | "neutral";
};

export type HsdFlowEdge = { from: string; to: string; label?: string };

export type HsdDiagnosticFlowGraph = {
  version: 1;
  system: "hvac" | "plumbing" | "electrical" | "unknown";
  issue_label: string;
  nodes: HsdFlowNode[];
  edges: HsdFlowEdge[];
};

function issueForQuotedNode(issue: string): string {
  return String(issue || "Issue")
    .replace(/\\/g, " ")
    .replace(/"/g, "'")
    .replace(/\r?\n/g, " ")
    .trim()
    .slice(0, 80) || "Issue";
}

function mermaidSafeLabel(issue: string): string {
  return String(issue || "Issue")
    .replace(/[[\](){}"]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 56) || "Issue";
}

function normalizeSystem(category: string): HsdDiagnosticFlowGraph["system"] {
  const cat = (category || "").trim().toLowerCase();
  if (cat === "plumbing") return "plumbing";
  if (cat === "electrical") return "electrical";
  if (cat === "hvac") return "hvac";
  return "unknown";
}

export function isHsdDiagnosticFlowGraph(v: unknown): v is HsdDiagnosticFlowGraph {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (o.version !== 1) return false;
  if (o.system !== "hvac" && o.system !== "plumbing" && o.system !== "electrical" && o.system !== "unknown") {
    return false;
  }
  if (typeof o.issue_label !== "string") return false;
  if (!Array.isArray(o.nodes) || !Array.isArray(o.edges)) return false;
  for (const n of o.nodes) {
    if (!n || typeof n !== "object") return false;
    const node = n as Record<string, unknown>;
    if (typeof node.id !== "string" || typeof node.label !== "string") return false;
    const kind = node.kind;
    if (kind !== "start" && kind !== "decision" && kind !== "outcome") return false;
  }
  for (const e of o.edges) {
    if (!e || typeof e !== "object") return false;
    const edge = e as Record<string, unknown>;
    if (typeof edge.from !== "string" || typeof edge.to !== "string") return false;
  }
  return true;
}

/**
 * Deterministic triage graph (not AI). Mirrors legacy {@link generateMermaid} branching.
 */
export function buildDiagnosticFlowGraph(category: string, issue: string): HsdDiagnosticFlowGraph {
  const system = normalizeSystem(category);
  const label = mermaidSafeLabel(issue);

  if (system === "hvac") {
    return {
      version: 1,
      system: "hvac",
      issue_label: issue,
      nodes: [
        { id: "A", kind: "start", label: issue },
        { id: "B", kind: "decision", label: "Airflow Present?" },
        { id: "C", kind: "outcome", label: "Filter / Blower Issue", styleClass: "airflow" },
        { id: "D", kind: "decision", label: "Air Cold?" },
        { id: "E", kind: "outcome", label: "Refrigerant / Compressor", styleClass: "refrigerant" },
        { id: "F", kind: "outcome", label: "System Load", styleClass: "load" },
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C", label: "No" },
        { from: "B", to: "D", label: "Yes" },
        { from: "D", to: "E", label: "No" },
        { from: "D", to: "F", label: "Yes" },
      ],
    };
  }

  if (system === "plumbing") {
    return {
      version: 1,
      system: "plumbing",
      issue_label: issue,
      nodes: [
        { id: "A", kind: "start", label },
        { id: "B", kind: "decision", label: "Water Flow Normal?" },
        { id: "C", kind: "outcome", label: "Supply / Pressure Issue" },
        { id: "D", kind: "decision", label: "Hot Water Present?" },
        { id: "E", kind: "outcome", label: "Water Heater Failure" },
        { id: "F", kind: "outcome", label: "Localized Fixture Issue" },
        { id: "G", kind: "outcome", label: "Heater Component Failure" },
        { id: "H", kind: "outcome", label: "Clog / Valve Problem" },
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C", label: "No" },
        { from: "B", to: "D", label: "Yes" },
        { from: "D", to: "E", label: "No" },
        { from: "D", to: "F", label: "Yes" },
        { from: "E", to: "G" },
        { from: "F", to: "H" },
      ],
    };
  }

  if (system === "electrical") {
    return {
      version: 1,
      system: "electrical",
      issue_label: issue,
      nodes: [
        { id: "A", kind: "start", label },
        { id: "B", kind: "decision", label: "Power Present?" },
        { id: "C", kind: "outcome", label: "Breaker / Panel Issue" },
        { id: "D", kind: "decision", label: "Device Working?" },
        { id: "E", kind: "outcome", label: "Outlet / Switch Fault" },
        { id: "F", kind: "outcome", label: "Intermittent Load Issue" },
        { id: "G", kind: "outcome", label: "Wiring / Connection Fault" },
        { id: "H", kind: "outcome", label: "Overload / Circuit Instability" },
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C", label: "No" },
        { from: "B", to: "D", label: "Yes" },
        { from: "D", to: "E", label: "No" },
        { from: "D", to: "F", label: "Yes" },
        { from: "E", to: "G" },
        { from: "F", to: "H" },
      ],
    };
  }

  return { version: 1, system: "unknown", issue_label: label, nodes: [], edges: [] };
}

/** Emit Mermaid `flowchart TD` source for client-side `mermaid.render` only — never persist this string. */
export function graphToMermaid(g: HsdDiagnosticFlowGraph): string {
  if (!g.nodes.length) return "";

  if (g.system === "hvac") {
    const safeIssue = issueForQuotedNode(g.issue_label);
    return `
flowchart TD
A["${safeIssue}"] --> B{"Airflow Present?"}

B -->|No| C["Filter / Blower Issue:::airflow"]
B -->|Yes| D{"Air Cold?"}

D -->|No| E["Refrigerant / Compressor:::refrigerant"]
D -->|Yes| F["System Load:::load"]

classDef airflow fill:#fff,stroke:#999;
classDef refrigerant fill:#fff,stroke:#999;
classDef load fill:#fff,stroke:#999;
`.trim();
  }

  if (g.system === "plumbing") {
    const lab = mermaidSafeLabel(g.issue_label);
    return `
flowchart TD
A[${lab}] --> B{Water Flow Normal?}

B -->|No| C[Supply / Pressure Issue]
B -->|Yes| D{Hot Water Present?}

D -->|No| E[Water Heater Failure]
D -->|Yes| F[Localized Fixture Issue]

E --> G[Heater Component Failure]
F --> H[Clog / Valve Problem]
`.trim();
  }

  if (g.system === "electrical") {
    const lab = mermaidSafeLabel(g.issue_label);
    return `
flowchart TD
A[${lab}] --> B{Power Present?}

B -->|No| C[Breaker / Panel Issue]
B -->|Yes| D{Device Working?}

D -->|No| E[Outlet / Switch Fault]
D -->|Yes| F[Intermittent Load Issue]

E --> G[Wiring / Connection Fault]
F --> H[Overload / Circuit Instability]
`.trim();
  }

  return "";
}
