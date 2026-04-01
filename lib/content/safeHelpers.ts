/**
 * Safe Helpers — Defensive Content Normalization
 * ---------------------------------------------
 * NEVER assume DB content is directly renderable HTML.
 * Type-guard first. Never call .replace() on unknown values.
 *
 * Use these helpers in the translator layer only.
 * @see docs/MASTER-PROMPT-DECISIONGRID.md
 */

/** Strip HTML tags to plain text. Use for legacy HTML fields — NEVER render raw HTML from DB. */
export function stripHtmlToText(html: unknown): string {
  if (html == null) return "";
  if (typeof html !== "string") return String(html).trim();
  // Simple tag strip — no .replace on unknown, we've type-guarded
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text || "";
}

/**
 * Convert unknown to safe string. Never throws.
 * Returns undefined for null/undefined, trimmed string otherwise.
 */
export function toSafeString(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") {
    const s = v.trim();
    return s || undefined;
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return undefined;
}

/**
 * Convert unknown to string array. Handles mixed string/object arrays.
 * Always returns array of strings.
 */
export function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    if (typeof item === "string") {
      const s = item.trim();
      if (s) out.push(s);
    } else if (typeof item === "object" && item !== null) {
      const o = item as Record<string, unknown>;
      const s = toSafeString(o.action ?? o.step ?? o.name ?? o.title ?? o.value ?? o.description);
      if (s) out.push(s);
    } else if (item != null) {
      const s = String(item).trim();
      if (s) out.push(s);
    }
  }
  return out;
}

/**
 * Convert unknown to array of objects. Each entry is normalized to Record<string, unknown>.
 */
export function toObjectArray<T = Record<string, unknown>>(
  v: unknown,
  mapper?: (o: Record<string, unknown>) => T
): T[] {
  if (!Array.isArray(v)) return [];
  const out: T[] = [];
  for (const item of v) {
    if (typeof item === "object" && item !== null && !Array.isArray(item)) {
      const o = item as Record<string, unknown>;
      out.push((mapper ? mapper(o) : o) as T);
    }
  }
  return out;
}

/** Normalize a single cause-like object to { name, indicator?, explanation?, ... } */
export const causeCardShape = {
  name: (o: Record<string, unknown>) => toSafeString(o.name) ?? "Unknown",
  indicator: (o: Record<string, unknown>) => {
    if (Array.isArray(o.symptoms_to_confirm)) return toStringArray(o.symptoms_to_confirm).join(", ");
    return toSafeString(o.indicator ?? o.symptoms_to_confirm);
  },
  explanation: (o: Record<string, unknown>) => toSafeString(o.explanation ?? o.symptoms ?? o.why_it_happens),
  difficulty: (o: Record<string, unknown>) => toSafeString(o.difficulty),
  difficultyColor: (o: Record<string, unknown>) => toSafeString(o.difficultyColor),
  cost: (o: Record<string, unknown>) => toSafeString(o.cost ?? o.estimated_cost),
  diyFriendly: (o: Record<string, unknown>) => toSafeString(o.diyFriendly),
};

/** Normalize cause cards from raw array (strings or objects). Skips invalid entries. */
export function normalizeCauseCards(
  v: unknown,
  graphCauses?: unknown[]
): Array<{ name: string; indicator?: string; explanation?: string; difficulty?: string; difficultyColor?: string; cost?: string; diyFriendly?: string }> {
  const arr = toObjectArray(v);
  if (arr.length > 0) {
    return arr
      .map((o) => {
        const name = causeCardShape.name(o);
        if (!name || name.trim() === "") return null;
        return {
          name,
          indicator: causeCardShape.indicator(o),
          explanation: causeCardShape.explanation(o),
          difficulty: causeCardShape.difficulty(o),
          difficultyColor: causeCardShape.difficultyColor(o),
          cost: causeCardShape.cost(o),
          diyFriendly: causeCardShape.diyFriendly(o),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }
  if (Array.isArray(graphCauses) && graphCauses.length > 0) {
    return graphCauses.map((c) => {
      const o = (typeof c === "object" && c !== null ? c : {}) as Record<string, unknown>;
      const repairs = (o.repairDetails as unknown[]) ?? [];
      const first = repairs[0] as Record<string, unknown> | undefined;
      return {
        name: causeCardShape.name(o),
        explanation: causeCardShape.explanation(o),
        difficulty: first ? (String(first.diyDifficulty) === "rookie" ? "Easy" : "Moderate") : "Moderate",
        cost: first ? (String(first.estimatedCost) === "low" ? "$50–$150" : String(first.estimatedCost) === "medium" ? "$150–$450" : "$450+") : undefined,
      };
    });
  }
  return [];
}

/** Normalize FAQ items from raw array. Skips invalid entries. */
export function normalizeFaqItems(
  v: unknown
): Array<{ question: string; answer: string }> {
  const arr = toObjectArray(v);
  return arr
    .map((o) => {
      const question = toSafeString(o.question) ?? "";
      if (!question) return null;
      return { question, answer: toSafeString(o.answer) ?? "" };
    })
    .filter((f): f is { question: string; answer: string } => f !== null);
}

/** Normalize tool/part arrays. Handles legacy strings. Skips invalid entries. */
export function normalizeToolOrPartItems(v: unknown): Array<{ name: string; description?: string }> {
  if (!Array.isArray(v)) return [];
  const out: Array<{ name: string; description?: string }> = [];
  for (const item of v) {
    if (typeof item === "string") {
      const s = item.trim();
      if (s) out.push({ name: s });
    } else if (typeof item === "object" && item !== null && !Array.isArray(item)) {
      const o = item as Record<string, unknown>;
      const name = toSafeString(o.name ?? o.title);
      if (!name) continue;
      out.push({
        name,
        description: toSafeString(o.description ?? o.reason ?? o.purpose),
      });
    }
  }
  return out;
}

/** Normalize repair steps. Handles legacy strings and mixed arrays. */
export function normalizeRepairSteps(v: unknown): Array<{ step?: number; action: string; description?: string }> {
  const arr = toStringArray(v);
  if (arr.length > 0) return arr.map((s, i) => ({ step: i + 1, action: s }));
  const objArr = toObjectArray(v);
  return objArr
    .map((o, i) => {
      const action = toSafeString(o.action ?? o.step ?? o.description) ?? "";
      if (!action) return null;
      return { step: i + 1, action, description: toSafeString(o.description ?? o.expected_result) };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

/** Normalize repair-like objects */
export const repairCardShape = {
  name: (o: Record<string, unknown>) => toSafeString(o.name) ?? "Unknown",
  difficulty: (o: Record<string, unknown>) => toSafeString(o.difficulty),
  cost: (o: Record<string, unknown>) => toSafeString(o.cost ?? o.estimated_cost),
  link: (o: Record<string, unknown>) => (o.slug ? `/fix/${o.slug}` : toSafeString(o.link)),
  slug: (o: Record<string, unknown>) => toSafeString(o.slug),
};

/** Normalize tool-like objects */
export const toolCardShape = {
  name: (o: Record<string, unknown>) => toSafeString(o.name) ?? "",
  reason: (o: Record<string, unknown>) => toSafeString(o.reason ?? o.purpose),
  description: (o: Record<string, unknown>) => toSafeString(o.description ?? o.reason ?? o.purpose),
  affiliateUrl: (o: Record<string, unknown>) => (typeof o.affiliateUrl === "string" ? o.affiliateUrl : null),
};
