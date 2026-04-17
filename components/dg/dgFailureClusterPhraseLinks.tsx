import type { ReactNode } from "react";
import Link from "next/link";
import { DG_AUTHORITY_PHRASE_LINKS } from "@/lib/dg/dgAuthoritySeoRegistry";
import type { Trade } from "@/lib/dg/resolveCTA";

export type PhraseLinkBudget = { remaining: number };

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function phrasesForTrade(trade: Trade | undefined): typeof DG_AUTHORITY_PHRASE_LINKS {
  if (!trade) return [];
  return DG_AUTHORITY_PHRASE_LINKS.filter((e) => e.trades.includes(trade)).sort(
    (a, b) => b.phrase.length - a.phrase.length
  );
}

/**
 * Injects **at most** `budget.remaining` internal links total (recursive across the string).
 * Only for **failure cluster** (and similarly gated) fields — never hero, CTAs, or Mermaid.
 */
export function injectFailureClusterPhraseLinks(
  text: string,
  trade: Trade | undefined,
  budget: PhraseLinkBudget
): ReactNode {
  if (!text || budget.remaining <= 0) return text;

  const entries = phrasesForTrade(trade);
  for (const e of entries) {
    if (budget.remaining <= 0) break;
    const re = new RegExp(`\\b${escapeRegExp(e.phrase)}\\b`, "i");
    const m = re.exec(text);
    if (m && m.index !== undefined) {
      const before = text.slice(0, m.index);
      const matched = text.slice(m.index, m.index + m[0].length);
      const after = text.slice(m.index + m[0].length);
      budget.remaining -= 1;
      return (
        <>
          {before}
          <Link href={e.href} className="dg-inline-diagnostic-link">
            {matched}
          </Link>
          {injectFailureClusterPhraseLinks(after, trade, budget)}
        </>
      );
    }
  }

  return text;
}
