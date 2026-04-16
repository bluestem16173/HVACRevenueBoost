export type QuickDecisionBranch = {
  situation: string;
  leads_to: string;
  /** In-page fragment id (kebab-case, unique). */
  anchor: string;
  /** Hash targets for main guide sections (e.g. section-quick-checks). */
  section_ids?: string[];
};

const SECTION_IDS = [
  "section-quick-checks",
  "section-likely-causes",
  "section-diagnostic-steps",
  "section-repair-vs-pro",
] as const;

/** Default map for built-in no-start branches → main sections. */
const DEFAULT_BRANCH_SECTIONS: Record<string, string[]> = {
  "qdt-thermostat-no-power": ["section-quick-checks", "section-diagnostic-steps"],
  "qdt-clicks-wont-start": ["section-likely-causes", "section-diagnostic-steps", "section-repair-vs-pro"],
  "qdt-outdoor-not-running": ["section-quick-checks", "section-diagnostic-steps", "section-repair-vs-pro"],
  "qdt-airflow-weak": ["section-quick-checks", "section-likely-causes"],
};

/** When JSON omits the tree, use this for no-start / won’t-run AC pages. */
export const DEFAULT_AC_NOT_TURNING_ON_DECISION_TREE: QuickDecisionBranch[] = [
  {
    situation: "Thermostat has no power",
    leads_to: "Likely electrical issue",
    anchor: "qdt-thermostat-no-power",
    section_ids: DEFAULT_BRANCH_SECTIONS["qdt-thermostat-no-power"],
  },
  {
    situation: "AC clicks but won’t start",
    leads_to: "Capacitor / contactor",
    anchor: "qdt-clicks-wont-start",
    section_ids: DEFAULT_BRANCH_SECTIONS["qdt-clicks-wont-start"],
  },
  {
    situation: "Outdoor unit not running",
    leads_to: "Breaker / disconnect / compressor",
    anchor: "qdt-outdoor-not-running",
    section_ids: DEFAULT_BRANCH_SECTIONS["qdt-outdoor-not-running"],
  },
  {
    situation: "Airflow weak or none",
    leads_to: "Filter / blower issue",
    anchor: "qdt-airflow-weak",
    section_ids: DEFAULT_BRANCH_SECTIONS["qdt-airflow-weak"],
  },
];

function slugLooksLikeNoStartAc(slug: string): boolean {
  const s = slug.toLowerCase();
  return (
    s.includes("not-turning-on") ||
    s.includes("wont-turn-on") ||
    s.includes("not-starting")
  );
}

function kebabAnchor(s: string, maxLen = 48): string {
  const base = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLen);
  return base || "branch";
}

function normalizeSectionIds(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const allowed = new Set(SECTION_IDS);
  const out = raw
    .map((x) => String(x ?? "").trim())
    .filter((id) => allowed.has(id as (typeof SECTION_IDS)[number]));
  return out.length ? out : undefined;
}

function ensureUniqueAnchors(branches: QuickDecisionBranch[]): QuickDecisionBranch[] {
  const used = new Set<string>();
  return branches.map((b, i) => {
    let a = b.anchor || `qdt-${kebabAnchor(b.situation)}`;
    if (!/^qdt-/.test(a)) a = `qdt-${kebabAnchor(a)}`;
    let candidate = a;
    let n = 0;
    while (used.has(candidate)) {
      n += 1;
      candidate = `${a}-${n}`;
    }
    used.add(candidate);
    return { ...b, anchor: candidate };
  });
}

/**
 * Reads `quick_decision_tree` from HSD JSON: array of `{ situation, leads_to, anchor?, section_ids? }`
 * or legacy `{ label, outcome }`. Falls back to default branches for no-start AC slugs.
 */
export function getQuickDecisionTreeBranches(
  data: Record<string, unknown>,
  pageSlug: string
): QuickDecisionBranch[] | null {
  const raw = data.quick_decision_tree;
  if (Array.isArray(raw) && raw.length > 0) {
    const out: QuickDecisionBranch[] = [];
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const situation =
        (typeof o.situation === "string" && o.situation.trim()) ||
        (typeof o.label === "string" && o.label.trim()) ||
        "";
      const leads_to =
        (typeof o.leads_to === "string" && o.leads_to.trim()) ||
        (typeof o.outcome === "string" && o.outcome.trim()) ||
        "";
      const anchorRaw = typeof o.anchor === "string" ? o.anchor.trim() : "";
      const fromJson = normalizeSectionIds(o.section_ids);
      const baseAnchor = anchorRaw || `qdt-${kebabAnchor(situation)}`;
      const mapped =
        DEFAULT_BRANCH_SECTIONS[baseAnchor] ||
        DEFAULT_BRANCH_SECTIONS[anchorRaw] ||
        DEFAULT_BRANCH_SECTIONS[`qdt-${kebabAnchor(situation)}`];
      const section_ids =
        fromJson && fromJson.length ? fromJson : mapped ? [...mapped] : [...SECTION_IDS];
      if (situation && leads_to) {
        out.push({
          situation,
          leads_to,
          anchor: /^qdt-/.test(baseAnchor) ? baseAnchor : `qdt-${kebabAnchor(baseAnchor)}`,
          section_ids,
        });
      }
    }
    if (out.length >= 3) return ensureUniqueAnchors(out);
  }

  const slug = String(data.slug || pageSlug || "").toLowerCase();
  if (slugLooksLikeNoStartAc(slug)) {
    return DEFAULT_AC_NOT_TURNING_ON_DECISION_TREE;
  }

  return null;
}

export const HSD_SECTION_ANCHOR_LABELS: Record<string, string> = {
  "section-quick-checks": "Quick checks",
  "section-likely-causes": "Likely causes",
  "section-diagnostic-steps": "Diagnostic steps",
  "section-repair-vs-pro": "DIY vs call a pro",
};

export function sectionLinksForBranch(b: QuickDecisionBranch): { id: string; label: string }[] {
  const ids =
    b.section_ids && b.section_ids.length
      ? b.section_ids
      : DEFAULT_BRANCH_SECTIONS[b.anchor] || [...SECTION_IDS];
  return ids.map((id) => ({ id, label: HSD_SECTION_ANCHOR_LABELS[id] || id }));
}
