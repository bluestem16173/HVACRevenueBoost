import type { Trade } from "@/lib/dg/resolveCTA";
import { DG_AUTHORITY_SEO_PAGES } from "@/lib/dg/dgAuthoritySeoRegistry";

/** Middle path segment after `/{trade}/`, e.g. `ac-not-cooling` (no city). */
export type SymptomSlug = string;

export type DgRelatedDiagnosticRef = {
  href: string;
  title: string;
  /** When set, {@link DGRelatedPages} groups headings (symptoms vs pillar vs cost/replace). */
  role?: "sibling" | "pillar" | "cost" | "escalation";
};

/** Canonical pillar hub slug per trade (DecisionGrid authority cluster v1). */
export const AUTHORITY_PILLAR_SLUG: Record<Trade, string> = {
  hvac: "why-ac-isnt-cooling",
  plumbing: "why-you-have-no-hot-water",
  electrical: "why-breakers-trip",
};

/** Nine supporting symptom slugs per trade (publish set). */
export const AUTHORITY_SUPPORTING_SLUGS: Record<Trade, readonly SymptomSlug[]> = {
  hvac: [
    "ac-not-cooling",
    "weak-airflow",
    "ac-short-cycling",
    "outside-unit-not-running",
    "frozen-evaporator-coil",
    "ac-blowing-warm-air",
    "ac-making-noise",
    "high-humidity-in-house",
    "hvac-repair-vs-replace",
  ],
  plumbing: [
    "water-heater-not-working",
    "no-hot-water",
    "water-heater-leaking",
    "low-water-pressure",
    "no-water-in-house",
    "toilet-wont-flush",
    "drain-smell-in-house",
    "t-p-relief-valve-dripping",
    "water-heater-repair-vs-replace",
  ],
  electrical: [
    "circuit-overload",
    "breaker-trips-instantly",
    "outlet-not-working",
    "lights-flickering",
    "burning-smell-from-panel",
    "gfci-keeps-tripping",
    "partial-power-in-house",
    "panel-buzzing",
    "electrical-repair-vs-replace",
  ],
};

/**
 * Exactly three sibling slugs per supporting page (same cluster interlinking).
 * Pillar pages use {@link AUTHORITY_SUPPORTING_SLUGS} instead.
 */
export const AUTHORITY_SIBLING_BY_SLUG: Record<Trade, Record<string, readonly SymptomSlug[]>> = {
  hvac: {
    "ac-not-cooling": ["weak-airflow", "frozen-evaporator-coil", "outside-unit-not-running"],
    "weak-airflow": ["ac-not-cooling", "frozen-evaporator-coil", "high-humidity-in-house"],
    "ac-short-cycling": ["outside-unit-not-running", "ac-making-noise", "hvac-repair-vs-replace"],
    "outside-unit-not-running": ["ac-not-cooling", "ac-short-cycling", "ac-blowing-warm-air"],
    "frozen-evaporator-coil": ["weak-airflow", "ac-not-cooling", "high-humidity-in-house"],
    "ac-blowing-warm-air": ["ac-not-cooling", "outside-unit-not-running", "ac-making-noise"],
    "ac-making-noise": ["ac-short-cycling", "ac-blowing-warm-air", "hvac-repair-vs-replace"],
    "high-humidity-in-house": ["weak-airflow", "ac-not-cooling", "frozen-evaporator-coil"],
    "hvac-repair-vs-replace": ["ac-not-cooling", "ac-short-cycling", "outside-unit-not-running"],
  },
  plumbing: {
    "water-heater-not-working": ["no-hot-water", "water-heater-leaking", "t-p-relief-valve-dripping"],
    "no-hot-water": ["water-heater-not-working", "low-water-pressure", "water-heater-repair-vs-replace"],
    "water-heater-leaking": ["t-p-relief-valve-dripping", "no-hot-water", "water-heater-repair-vs-replace"],
    "low-water-pressure": ["no-water-in-house", "no-hot-water", "toilet-wont-flush"],
    "no-water-in-house": ["low-water-pressure", "toilet-wont-flush", "drain-smell-in-house"],
    "toilet-wont-flush": ["low-water-pressure", "no-water-in-house", "drain-smell-in-house"],
    "drain-smell-in-house": ["toilet-wont-flush", "no-water-in-house", "low-water-pressure"],
    "t-p-relief-valve-dripping": ["water-heater-leaking", "no-hot-water", "water-heater-repair-vs-replace"],
    "water-heater-repair-vs-replace": ["water-heater-not-working", "water-heater-leaking", "t-p-relief-valve-dripping"],
  },
  electrical: {
    "circuit-overload": ["breaker-trips-instantly", "gfci-keeps-tripping", "electrical-repair-vs-replace"],
    "breaker-trips-instantly": ["circuit-overload", "burning-smell-from-panel", "panel-buzzing"],
    "outlet-not-working": ["gfci-keeps-tripping", "partial-power-in-house", "lights-flickering"],
    "lights-flickering": ["partial-power-in-house", "panel-buzzing", "burning-smell-from-panel"],
    "burning-smell-from-panel": ["panel-buzzing", "breaker-trips-instantly", "electrical-repair-vs-replace"],
    "gfci-keeps-tripping": ["outlet-not-working", "circuit-overload", "partial-power-in-house"],
    "partial-power-in-house": ["lights-flickering", "outlet-not-working", "panel-buzzing"],
    "panel-buzzing": ["burning-smell-from-panel", "breaker-trips-instantly", "lights-flickering"],
    "electrical-repair-vs-replace": ["circuit-overload", "burning-smell-from-panel", "panel-buzzing"],
  },
};

/**
 * Intent clusters (legacy fallback when a slug is outside the locked v1 map).
 * Slugs are the symptom segment only (before any `/tampa-fl` city suffix).
 */
export const AUTHORITY_SYMPTOM_CLUSTERS: Record<Trade, Record<string, readonly SymptomSlug[]>> = {
  hvac: {
    airflow: ["ac-not-cooling", "weak-airflow", "frozen-evaporator-coil", "high-humidity-in-house"],
    compressor: ["ac-not-cooling", "outside-unit-not-running", "ac-short-cycling", "ac-blowing-warm-air"],
  },
  plumbing: {
    water_heat: ["no-hot-water", "water-heater-not-working", "water-heater-leaking", "t-p-relief-valve-dripping"],
    distribution: ["low-water-pressure", "no-water-in-house", "toilet-wont-flush", "drain-smell-in-house"],
  },
  electrical: {
    branch_protection: ["circuit-overload", "breaker-trips-instantly", "gfci-keeps-tripping"],
    panel: ["burning-smell-from-panel", "panel-buzzing", "partial-power-in-house", "lights-flickering"],
  },
};

/** Display titles for sibling symptom slugs (renderer; not LLM HTML). */
const SIBLING_TITLE: Record<Trade, Record<string, string>> = {
  hvac: {
    "why-ac-isnt-cooling": "Why your AC isn’t cooling (complete guide)",
    "ac-not-cooling": "AC not cooling",
    "weak-airflow": "Weak airflow",
    "frozen-evaporator-coil": "Frozen evaporator coil",
    "outside-unit-not-running": "Outside unit not running",
    "ac-short-cycling": "AC short cycling",
    "ac-blowing-warm-air": "AC blowing warm air",
    "ac-making-noise": "AC making noise",
    "high-humidity-in-house": "High humidity in the house",
    "hvac-repair-vs-replace": "HVAC repair vs replace",
  },
  plumbing: {
    "why-you-have-no-hot-water": "Why you have no hot water (complete guide)",
    "water-heater-not-working": "Water heater not working",
    "no-hot-water": "No hot water",
    "water-heater-leaking": "Water heater leaking",
    "low-water-pressure": "Low water pressure",
    "no-water-in-house": "No water in the house",
    "toilet-wont-flush": "Toilet won’t flush",
    "drain-smell-in-house": "Drain smell in the house",
    "t-p-relief-valve-dripping": "T&P relief valve dripping",
    "water-heater-repair-vs-replace": "Water heater repair vs replace",
    "water-heater": "Water heater diagnostics",
  },
  electrical: {
    "why-breakers-trip": "Why breakers trip (complete guide)",
    "circuit-overload": "Circuit overload",
    "breaker-trips-instantly": "Breaker trips instantly",
    "outlet-not-working": "Outlet not working",
    "lights-flickering": "Lights flickering",
    "burning-smell-from-panel": "Burning smell from panel",
    "gfci-keeps-tripping": "GFCI keeps tripping",
    "partial-power-in-house": "Partial power in the house",
    "panel-buzzing": "Panel buzzing",
    "electrical-repair-vs-replace": "Electrical repair vs replace",
  },
};

/** Pillar, cost guide, repair-vs-replace — merged on every authority page (deduped). */
export const AUTHORITY_HUB_LINKS: Record<
  Trade,
  { pillar: DgRelatedDiagnosticRef; cost: DgRelatedDiagnosticRef; escalation: DgRelatedDiagnosticRef }
> = {
  hvac: {
    pillar: {
      href: "/hvac/why-ac-isnt-cooling",
      title: "Why Your AC Isn’t Cooling: Complete Diagnostic Guide",
      role: "pillar",
    },
    cost: { href: "/cost/ac-repair", title: "AC repair cost guide", role: "cost" },
    escalation: {
      href: "/hvac/hvac-repair-vs-replace",
      title: "HVAC repair vs replace",
      role: "escalation",
    },
  },
  plumbing: {
    pillar: {
      href: "/plumbing/why-you-have-no-hot-water",
      title: "Why You Have No Hot Water: Complete Diagnostic Guide",
      role: "pillar",
    },
    cost: { href: "/cost/water-heater", title: "Water heater repair cost guide", role: "cost" },
    escalation: {
      href: "/plumbing/water-heater-repair-vs-replace",
      title: "Water heater repair vs replace",
      role: "escalation",
    },
  },
  electrical: {
    pillar: {
      href: "/electrical/why-breakers-trip",
      title: "Why Breakers Trip: Complete Diagnostic Guide",
      role: "pillar",
    },
    cost: { href: "/cost/electrical-panel", title: "Electrical panel & breaker cost guide", role: "cost" },
    escalation: {
      href: "/electrical/electrical-repair-vs-replace",
      title: "Electrical repair vs replace",
      role: "escalation",
    },
  },
};

export function normPath(p: string): string {
  return `/${p.replace(/^\/+/, "").replace(/\/+$/, "")}`;
}

/** `hvac/ac-not-cooling/tampa-fl` → `{ symptomKey: ac-not-cooling, citySlug: tampa-fl }` */
export function parseAuthorityPagePath(
  pagePath: string,
  trade: Trade
): { symptomKey: string | null; citySlug: string | null } {
  const parts = pagePath.split("/").filter(Boolean);
  if (!parts.length) return { symptomKey: null, citySlug: null };
  const start = parts[0] === trade ? 1 : 0;
  if (start >= parts.length) return { symptomKey: null, citySlug: null };
  if (parts.length === start + 1) {
    return { symptomKey: parts[start] ?? null, citySlug: null };
  }
  return {
    symptomKey: parts[start] ?? null,
    citySlug: parts[parts.length - 1] ?? null,
  };
}

function siblingHref(trade: Trade, symptomSlug: string, citySlug: string | null): string {
  if (citySlug) return normPath(`${trade}/${symptomSlug}/${citySlug}`);
  return normPath(`${trade}/${symptomSlug}`);
}

function siblingTitle(trade: Trade, symptomSlug: string, citySlug: string | null): string {
  const base =
    SIBLING_TITLE[trade]?.[symptomSlug] ??
    symptomSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  if (citySlug && /tampa|florida|fl/i.test(citySlug)) return `${base} (Tampa)`;
  return base;
}

function tokenize(s: string): Set<string> {
  const out = new Set<string>();
  const parts = s.toLowerCase().split(/[^a-z0-9]+/).filter((x) => x.length >= 3);
  for (const p of parts) out.add(p);
  return out;
}

function sharesKeyword(pageTokens: Set<string>, entry: (typeof DG_AUTHORITY_SEO_PAGES)[0]): boolean {
  return entry.keywords.some((k) => pageTokens.has(k.toLowerCase()));
}

/** All cluster ids that contain this symptom (e.g. ac-not-cooling in airflow + compressor). */
export function clusterIdsForSymptom(trade: Trade, symptomKey: string | null): string[] {
  if (!symptomKey) return [];
  const clusters = AUTHORITY_SYMPTOM_CLUSTERS[trade];
  if (!clusters) return [];
  const out: string[] = [];
  for (const [id, slugs] of Object.entries(clusters)) {
    if (slugs.includes(symptomKey)) out.push(id);
  }
  return out;
}

/** Sibling symptom slugs same trade + shared cluster, excluding current. */
export function siblingSlugsForPage(trade: Trade, symptomKey: string | null, max = 5): string[] {
  if (!symptomKey) return [];
  const clusterIds = clusterIdsForSymptom(trade, symptomKey);
  const seen = new Set<string>([symptomKey]);
  const out: string[] = [];
  const clusters = AUTHORITY_SYMPTOM_CLUSTERS[trade];
  for (const cid of clusterIds) {
    const slugs = clusters[cid] ?? [];
    for (const s of slugs) {
      if (seen.has(s)) continue;
      seen.add(s);
      out.push(s);
      if (out.length >= max) return out;
    }
  }
  return out;
}

function pushUnique(out: DgRelatedDiagnosticRef[], seen: Set<string>, row: DgRelatedDiagnosticRef) {
  const h = normPath(row.href);
  if (seen.has(h)) return;
  seen.add(h);
  out.push({ ...row, href: h });
}

function appendHubs(
  trade: Trade,
  out: DgRelatedDiagnosticRef[],
  seen: Set<string>,
  pillarOverride?: { title: string; href: string } | null
) {
  const hub = AUTHORITY_HUB_LINKS[trade];
  if (!hub) return;
  const pillar =
    pillarOverride?.href && pillarOverride.title
      ? { href: normPath(pillarOverride.href), title: pillarOverride.title.trim(), role: "pillar" as const }
      : hub.pillar;
  pushUnique(out, seen, { ...pillar });
  pushUnique(out, seen, { ...hub.cost });
  pushUnique(out, seen, { ...hub.escalation });
}

export type ResolveAuthorityGraphInput = {
  trade: Trade;
  pagePath: string;
  title: string;
  summary: string;
  relatedPages?: { title: string; href: string }[];
  relatedLinkHints?: string[];
  /** When set, overrides default trade pillar hub (still internal paths only). */
  pillarPage?: { title: string; href: string } | null;
};

/** @deprecated Use {@link ResolveAuthorityGraphInput} */
export type ResolveRelatedDiagnosticsInput = ResolveAuthorityGraphInput;

/**
 * Authority graph: sibling symptoms (locked triples or pillar → nine supports) + pillar + cost + escalation.
 * Explicit `related_pages` (2+) lists curated siblings; hubs are always merged (deduped).
 */
export function resolveAuthorityGraphPages(input: ResolveAuthorityGraphInput): DgRelatedDiagnosticRef[] {
  const seen = new Set<string>();
  const out: DgRelatedDiagnosticRef[] = [];
  const self = normPath(input.pagePath);
  const { symptomKey, citySlug } = parseAuthorityPagePath(input.pagePath, input.trade);

  const push = (row: DgRelatedDiagnosticRef) => pushUnique(out, seen, row);

  if (Array.isArray(input.relatedPages) && input.relatedPages.length >= 2) {
    for (const row of input.relatedPages) {
      if (!row?.href || !row.title) continue;
      if (normPath(row.href) === self) continue;
      push({ href: row.href, title: row.title, role: "sibling" });
    }
  } else {
    for (const h of input.relatedLinkHints ?? []) {
      if (typeof h !== "string" || !h.trim().startsWith("/")) continue;
      const href = h.trim();
      if (normPath(href) === self) continue;
      const tail = href.replace(/^\//, "").split("/").pop() || href;
      const t = tail.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      push({ href, title: t, role: "sibling" });
    }

    const pillarSlug = AUTHORITY_PILLAR_SLUG[input.trade];
    if (symptomKey && symptomKey === pillarSlug) {
      for (const slug of AUTHORITY_SUPPORTING_SLUGS[input.trade]) {
        const href = siblingHref(input.trade, slug, citySlug);
        if (href === self) continue;
        push({
          href,
          title: siblingTitle(input.trade, slug, citySlug),
          role: "sibling",
        });
      }
    } else {
      const locked = symptomKey ? AUTHORITY_SIBLING_BY_SLUG[input.trade]?.[symptomKey] : undefined;
      if (locked?.length) {
        for (const slug of locked) {
          const href = siblingHref(input.trade, slug, citySlug);
          if (href === self) continue;
          push({
            href,
            title: siblingTitle(input.trade, slug, citySlug),
            role: "sibling",
          });
        }
      } else {
        const siblings = siblingSlugsForPage(input.trade, symptomKey, 5);
        for (const slug of siblings) {
          const href = siblingHref(input.trade, slug, citySlug);
          if (href === self) continue;
          push({
            href,
            title: siblingTitle(input.trade, slug, citySlug),
            role: "sibling",
          });
        }
      }

      const siblingCount = () => out.filter((r) => r.role === "sibling").length;
      if (siblingCount() < 3) {
        const pageTokens = tokenize(`${input.title} ${input.summary}`);
        for (const c of DG_AUTHORITY_SEO_PAGES) {
          if (c.trade !== input.trade) continue;
          if (normPath(c.href) === self) continue;
          if (!sharesKeyword(pageTokens, c)) continue;
          push({ href: c.href, title: c.title, role: "sibling" });
          if (siblingCount() >= 5) break;
        }
      }
    }
  }

  appendHubs(input.trade, out, seen, input.pillarPage ?? null);

  return out.slice(0, 14);
}

/** Alias for call sites / docs (“related diagnostics” UI). */
export function resolveRelatedDiagnosticsPages(input: ResolveRelatedDiagnosticsInput): DgRelatedDiagnosticRef[] {
  return resolveAuthorityGraphPages(input);
}
