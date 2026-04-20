/**
 * Canonical storage shape for path-like slugs (`pages.slug`, `page_queue.slug`, LLM `slug`):
 * `slug.replace(/^\/+/, "").trim()` — strip leading slashes only; internal `/` is kept.
 */
export function enforceStoredSlug(slug: string | null | undefined): string {
  return String(slug ?? "").replace(/^\/+/, "").trim();
}

/** `pages.slug` / catch-all joins: strip `diagnose/`, normalize vertical prefix, trim slashes, lowercase. */
export function normalizePagesTableSlugLookup(raw: string | null | undefined): string {
  const rawSlug = String(raw ?? "").trim();
  if (!rawSlug) return "";
  const slug = rawSlug
    .replace(/^diagnose\//i, "")
    .replace(/^(hvac|plumbing|electrical)\//i, (m) => m.toLowerCase())
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();
  return slug.trim();
}

export function normalizeSlug(rawSlug: string): string {
  if (!rawSlug) return "";
  
  let slug = rawSlug.toLowerCase().trim();

  // Strip prefixes
  if (slug.startsWith("diagnose/")) slug = slug.replace(/^diagnose\//, "");
  if (slug.startsWith("repair/")) slug = slug.replace(/^repair\//, "");
  
  // Strip garbage terms
  const badTerms = ["canary", "test", "v1", "full", "fixed"];
  for (const term of badTerms) {
    slug = slug.replace(new RegExp(`-${term}|${term}-`, "g"), "");
  }

  // Remove any remaining slashes (no nesting allowed)
  slug = slug.replace(/\//g, "-");
  
  // Clean multiple hyphens
  slug = slug.replace(/-+/g, "-").replace(/^-|-$/g, "");

  return slug;
}

/** Slug shape written by `page_queue` / HSD worker: `hvac/ac-not-cooling/tampa-fl`. */
export function isLocalizedPillarPageSlug(slug: string): boolean {
  return /^(hvac|plumbing|electrical)\/[a-z0-9-]+\/[a-z0-9-]+$/.test(
    enforceStoredSlug(slug).toLowerCase()
  );
}

/** National pillar row: `hvac/ac-not-cooling`, `plumbing/no-hot-water` (no city segment). */
export function isNationalVerticalPillarSlug(slug: string): boolean {
  return /^(hvac|plumbing|electrical)\/[a-z0-9-]+$/.test(
    enforceStoredSlug(slug).toLowerCase()
  );
}

/** Legacy storage before slug decouple: `diagnose/ac-not-cooling`. */
export function isLegacyDiagnosePrefixedSlug(slug: string): boolean {
  return /^diagnose\/[a-z0-9-]+$/.test(enforceStoredSlug(slug).toLowerCase());
}

export function isValidSlug(slug: string): boolean {
  if (!slug) return false;

  if (isLocalizedPillarPageSlug(slug)) return true;
  if (isNationalVerticalPillarSlug(slug)) return true;
  if (isLegacyDiagnosePrefixedSlug(slug)) return true;

  const badTerms = [
    "canary", "test", "v1", "full", "fixed",
    "after-", "when-", "while-",
    "cause/", "causes/", "repair/", "diagnose/",
  ];

  if (badTerms.some((t) => slug.includes(t))) return false;

  if (slug.includes("/")) return false;

  return true;
}

export function hasRenderableContent(page: any): boolean {
  // Rule 2: content_html is present (or legacy content block)
  const html =
    page.content_html ||
    (typeof page.content === "string" ? page.content : null);
  // We strictly require HTML as per Rule 2, even if JSON exists. 
  // If JSON only, it's not fully rendered for SEO yet!
  return !!html;
}

export function isValidTitle(page: any): boolean {
  // Rule 3: title exists and is not junk
  const title = page.title || (page.content_json?.name) || page.h1;
  if (!title) return false;
  
  const lower = title.toLowerCase();
  if (lower.includes("test") || lower.includes("canary") || lower.includes("untitled") || lower.length < 5) {
    return false;
  }
  return true;
}

export function isAllowedType(page: any): boolean {
  // Rule 5: page type is allowed
  const type = page.page_type || page.record_type || page.type || page.layer;
  if (!type) return false; // Enforce strict type schema presence
  
  if (type === "symptom") return true;
  /** Primary `pages.page_type` for diagnostic articles in many seeds and queue rows. */
  if (type === "diagnose") return true;
  if (type === "diagnostic") return true;
  if (type === "hvac_html") return true;
  if (type === "hvac_authority_v3") return true;

  /** Canonical HSD authority engine (`pages.page_type` + `schema_version` hsd_v2). */
  if (type === "hsd") return true;

  if (type === "dg_authority_v3") return true;

  if (type === "dg_authority_v2") {
    // only if slug is clean and not legacy v1-style junk
    if (!page.slug) return false;
    const lowerSlug = page.slug.toLowerCase();
    if (lowerSlug.includes("-v1") || lowerSlug.includes("v1-") || lowerSlug.includes("v1")) return false;
    if (lowerSlug.includes("test") || lowerSlug.includes("canary")) return false;
    if (!isValidSlug(page.slug)) return false;
    return true;
  }

  if (type === "city_symptom") return true;

  return false;
}

export function isHighIntentSlug(slug: string): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase();
  const localizedSymptom = s.match(/^(?:hvac|plumbing|electrical)\/([a-z0-9-]+)\//);
  const haystack = localizedSymptom ? `${s} ${localizedSymptom[1]}` : s;
  const highIntentKeywords = [
    "not-cooling",
    "broken",
    "emergency",
    "leaking",
    "smell",
    "blowing-warm",
    "stopped",
    "won't-turn-on",
    "wont-turn-on",
    "clogged",
    "running",
    "drain",
    "toilet",
    "water-heater",
    "pressure",
    "freezing",
    "thermostat",
    "turning-on",
    "hot-water",
  ];
  return highIntentKeywords.some((kw) => haystack.includes(kw));
}

export function calculateQualityScore(page: any): number {
  // If the DB already hard-assigns a score, we optionally trust it,
  // but to guarantee this 100-point logic, we calculate dynamically.
  let score = 0;

  // +20 clean slug
  if (isValidSlug(page.slug)) score += 20;

  // +15 title present and human-readable
  if (isValidTitle(page)) score += 15;

  // +15 content_html length above threshold (Assuming 1500 chars as a robust threshold)
  const htmlStr = (page.content_html || page.content || "").toLowerCase();
  if (htmlStr.length > 1500) score += 15;
  else if (page.slug && isLocalizedPillarPageSlug(String(page.slug))) {
    let cj: unknown = page.content_json;
    if (typeof cj === "string") {
      try {
        cj = JSON.parse(cj) as unknown;
      } catch {
        cj = null;
      }
    }
    const jsonBlob =
      cj && typeof cj === "object" ? JSON.stringify(cj).toLowerCase() : "";
    if (jsonBlob.length >= 600) score += 15;
  }

  // +10 content_json or structured sections present
  if (page.content_json && Object.keys(page.content_json).length > 0) score += 10;

  // +10 no junk tokens / debug markers
  const hasJunk = ["undefined", "null", "[insert", "todo:", "error:", "lorem ipsum"].some(junk => htmlStr.includes(junk));
  if (!hasJunk && htmlStr.length > 0) score += 10;

  // +10 page type in approved set
  if (isAllowedType(page)) score += 10;

  // +10 internal links present
  if (htmlStr.includes("href=") || htmlStr.includes("href=")) score += 10;

  // +10 local or high-intent keyword match
  const isLocalOrIntent = isHighIntentSlug(page.slug) || htmlStr.includes("florida") || htmlStr.includes("orlando") || htmlStr.includes("hvac") || htmlStr.includes("ac ");
  if (isLocalOrIntent) score += 10;

  return score;
}

export function isIndexable(page: any): boolean {
  if (!page) return false;

  // Strict Auto-Fails (overrides the algorithm)
  if (page.status !== "published") return false;

  // Localized HSD / city_symptom JSON pages — evaluate before `noindex` so a legacy DB flag does not 404 the route.
  // Crawl policy remains on routes via {@link strictRobotsForDbPage} when strict indexing is enabled.
  if (
    (page.page_type === "city_symptom" || page.page_type === "hsd") &&
    isLocalizedPillarPageSlug(page.slug)
  ) {
    let cj: unknown = page.content_json;
    if (typeof cj === "string") {
      try {
        cj = JSON.parse(cj) as unknown;
      } catch {
        cj = null;
      }
    }
    const jsonTitle =
      cj && typeof cj === "object" && typeof (cj as { title?: string }).title === "string"
        ? (cj as { title: string }).title.trim()
        : "";
    const rowTitle = typeof page.title === "string" ? page.title.trim() : "";
    const title = jsonTitle || rowTitle;
    if (title.length >= 5 && !title.toLowerCase().includes("untitled")) return true;
    return false;
  }

  if (page.noindex) return false;

  if (!isValidSlug(page.slug)) return false; // Auto-fail exact nested paths and spam patterns
  if (!isAllowedType(page)) return false; // Auto-fail non-approved schema structures

  // If it survives the auto-fails, gracefully grade it
  const score = calculateQualityScore(page);

  // 90-100 => approved
  if (score >= 90) return true;

  // 75-89 => approved if high-intent slug
  if (score >= 75 && score <= 89 && isHighIntentSlug(page.slug)) return true;

  // 60-74 => needs_regen (not indexable)
  // <60 => noindex or rejected
  return false;
}
