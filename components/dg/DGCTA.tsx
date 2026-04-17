import type { DgAuthorityCtaPayload } from "@/lib/dg/dgAuthorityCta";
import type { Trade } from "@/lib/dg/resolveCTA";

export type DGCTAVariant = "hero" | "mid" | "final";

type Props = DgAuthorityCtaPayload & {
  variant?: DGCTAVariant;
  /**
   * When true, mid/final use the locked conversion panel (navy gradient + gold button).
   * JSON-driven / legacy CTAs omit this for the previous light mid + white-button final look.
   */
  conversionLock?: boolean;
  /** When true (default), primary action opens the site lead modal unless `href` is a real URL. */
  connectLeadModal?: boolean;
  /** Prefill lead modal “Describe your problem” + city when the modal opens. */
  leadIssue?: string;
  leadLocation?: string;
  leadTrade?: Trade;
};

export function DGCTA({
  title,
  body,
  button,
  href,
  variant = "mid",
  conversionLock = false,
  connectLeadModal = true,
  leadIssue,
  leadLocation,
  leadTrade,
}: Props) {
  const useConversionPanel =
    conversionLock && (variant === "mid" || variant === "final");

  const cls = [
    "dg-cta",
    variant === "hero" ? "dg-cta--hero" : "",
    useConversionPanel ? "dg-cta--conversion" : "",
    variant === "mid" && !useConversionPanel ? "dg-cta--mid-muted" : "",
    variant === "final" && !useConversionPanel ? "dg-cta--final-legacy" : "",
    variant === "final" && useConversionPanel ? "dg-cta--final dg-cta--final-conversion" : "",
    variant === "mid" && useConversionPanel ? "dg-cta--mid" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const trimmed = href?.trim() ?? "";
  const useExternalLink = Boolean(trimmed && trimmed !== "#");
  const useModal = connectLeadModal && !useExternalLink;

  return (
    <aside className={cls} aria-label={title}>
      <h3 className="dg-cta__title">{title}</h3>
      <p className="dg-cta__body">{body}</p>
      {useExternalLink ? (
        <a className="dg-cta__button" href={trimmed}>
          {button}
        </a>
      ) : (
        <button
          type="button"
          className="dg-cta__button"
          data-open-lead-modal={useModal ? "" : undefined}
          data-lead-issue={leadIssue?.trim() || undefined}
          data-lead-location={leadLocation?.trim() || undefined}
          data-lead-trade={leadTrade ?? undefined}
        >
          {button}
        </button>
      )}
    </aside>
  );
}
