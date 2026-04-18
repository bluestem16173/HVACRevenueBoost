import type { DgAuthorityCtaPayload } from "@/lib/dg/dgAuthorityCta";

export type Trade = "hvac" | "plumbing" | "electrical";
export type Severity = "low" | "medium" | "high";

/** CTA copy keyed by trade + severity (compatible with {@link DgAuthorityCtaPayload}). */
export type CTA = Pick<DgAuthorityCtaPayload, "title" | "body" | "button">;

export function resolveCTA(trade: Trade, severity: Severity): CTA {
  if (trade === "electrical") {
    if (severity === "high") {
      return {
        title: "This may be a safety risk — get this checked",
        body: "Electrical faults that trip breakers or generate heat can escalate quickly. Misdiagnosis or repeated resets can damage wiring or create fire risk.",
        button: "Find a licensed electrician",
      };
    }
    return {
      title: "Electrical issues are easy to misread",
      body: "Even when symptoms seem minor, hidden faults can exist behind walls or at terminations.",
      button: "Request an electrical inspection",
    };
  }

  if (trade === "hvac") {
    if (severity === "high") {
      return {
        title: "This can turn into a major system failure",
        body: "Running an HVAC system with unresolved faults can damage compressors and significantly increase repair costs.",
        button: "Get an HVAC diagnostic",
      };
    }
    return {
      title: "Avoid replacing the wrong part",
      body: "Many HVAC issues look similar but require different fixes.",
      button: "Get a system diagnosis",
    };
  }

  if (trade === "plumbing") {
    if (severity === "high") {
      return {
        title: "Water damage risk increases quickly",
        body: "Leaks, pressure issues, or tank failures can escalate into structural damage.",
        button: "Find a licensed plumber",
      };
    }
    return {
      title: "Small plumbing issues rarely stay small",
      body: "What looks minor often spreads or worsens under pressure and use.",
      button: "Schedule a plumbing check",
    };
  }

  return {
    title: "Get a professional diagnosis",
    body: "A licensed technician can confirm the issue and prevent unnecessary repairs.",
    button: "Request service",
  };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Values passed from the page into smart CTAs + lead prefill. */
export type DgLeadCtaContext = {
  pageTitle: string;
  trade: Trade;
  location?: string | null;
};

/**
 * Strips trailing `(Location)` or `— Location` from the page title when it duplicates
 * `locationLabel` so CTA copy does not repeat “Tampa” twice.
 */
export function issuePhraseFromPageTitle(pageTitle: string, locationLabel?: string | null): string {
  let out = pageTitle.trim();
  const loc = locationLabel?.trim();
  if (loc) {
    out = out.replace(new RegExp(`\\s*\\(${escapeRegExp(loc)}\\)\\s*$`, "i"), "").trim();
    out = out.replace(new RegExp(`\\s*[—-]\\s*${escapeRegExp(loc)}\\s*$`, "i"), "").trim();
  }
  return out || pageTitle.trim();
}

function diagnosisButtonLabel(issueShort: string, locationLabel?: string | null): string {
  const issue = issueShort.trim();
  if (!issue) return "";
  const loc = locationLabel?.trim();
  return loc ? `Get a diagnosis for ${issue} in ${loc}` : `Get a diagnosis for ${issue}`;
}

/**
 * Severity/trade messaging from {@link resolveCTA}, with a **contextual primary button** when
 * `pageTitle` (and optional `location`) produce a diagnosis line, e.g.
 * “Get a diagnosis for AC Not Cooling in Tampa, FL”.
 */
export function resolveContextualCTA(
  trade: Trade,
  severity: Severity,
  ctx: Pick<DgLeadCtaContext, "pageTitle" | "location">
): CTA {
  const base = resolveCTA(trade, severity);
  const issue = issuePhraseFromPageTitle(ctx.pageTitle, ctx.location);
  const button = diagnosisButtonLabel(issue, ctx.location);
  if (!button) return base;
  return { ...base, button };
}
