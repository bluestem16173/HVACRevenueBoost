import type { DgAuthorityCtaPayload } from "@/lib/dg/dgAuthorityCta";
import type { Trade } from "@/lib/dg/resolveCTA";

/** Failure cluster: PRO (gold) / HOME (blue) / RISK (red) — all three required for publish quality. */
export type DgAuthorityV3FailureClusterDual = {
  title: string;
  pro: string;
  home: string;
  risk: string;
};

export type DgAuthorityV3RiskNote = {
  label: string;
  text: string;
};

/**
 * Complete `content_json` for `layout` / `schema_version` **dg_authority_v3**.
 * Builder stamps `layout`, `schema_version`. CTAs are JSON-driven (`cta_top`, `cta_mid`, `cta_final`).
 */
export type DgAuthorityV3PageInput = {
  title: string;
  location?: string;
  summary_30s: string;

  cta_top: DgAuthorityCtaPayload;

  /** 1–5 short measurable lines (technical / PRO layer); no paragraphs. */
  quick_checks: string[];
  /** Optional legacy: if omitted, renderer joins `quick_checks` for the gold PRO block. */
  quick_checks_pro?: string;
  quick_checks_home: string;

  diagnostic_logic_pro: string;
  diagnostic_logic_home: string;
  diagnostic_flow: string | Record<string, unknown>;
  system_explanation: string;

  failure_clusters: DgAuthorityV3FailureClusterDual[];

  repair_matrix: string[];
  repair_matrix_pro: string;
  repair_matrix_home: string;
  repair_matrix_risk?: string;

  cta_mid: DgAuthorityCtaPayload;

  field_measurements: string[];
  field_measurements_pro: string;
  field_measurements_home: string;

  repair_vs_replace_pro: string;
  repair_vs_replace_home: string;

  professional_threshold: string;
  warnings: string[];

  cta_final: DgAuthorityCtaPayload;

  /** Exactly 3–4 observations to gather before calling. */
  before_you_call: string[];
  do_not_attempt: string[];

  risk_notes?: DgAuthorityV3RiskNote[];

  /** Optional CMS / queue metadata (copied onto `content_json` by {@link buildDgAuthorityV3Page}). */
  trade?: Trade;
  slug?: string;
  cluster?: string;
  diagnostic_mermaid_cluster?: string;
  diagnostic_flow_template_key?: string;
  diagnostic_flow_issue_label?: string;
  pillar_page?: string;
  related_pages?: unknown;
  safety_notice?: string;
  where_people_get_this_wrong?: string;
  diagnostic_mermaid_mode?: string;
};
