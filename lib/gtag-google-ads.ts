/**
 * Google Ads (gtag.js) — global config + conversion events.
 *
 * Env (public, client-visible):
 * - `NEXT_PUBLIC_GOOGLE_ADS_ID` — e.g. `AW-123456789` (loads gtag + `gtag('config', …)`).
 * - `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_SEND_TO` — e.g. `AW-123456789/AbCdEfGhIj` (passed to
 *   `gtag('event','conversion',{ send_to })`). If omitted, only config loads (no conversion fire).
 *
 * If only `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_SEND_TO` is set, the AW id prefix before `/` is used for `config`.
 */

const AW_ID_RE = /^AW-[A-Za-z0-9-]+$/;

function sanitizeAwId(raw: string): string | undefined {
  const s = raw.trim();
  return AW_ID_RE.test(s) ? s : undefined;
}

function sanitizeSendTo(raw: string): string | undefined {
  const s = raw.trim().slice(0, 256);
  const i = s.indexOf("/");
  if (i < 1) return undefined;
  const prefix = s.slice(0, i).trim();
  const label = s.slice(i + 1).trim();
  if (!sanitizeAwId(prefix) || !label || /[\s#?]/.test(label)) return undefined;
  return `${prefix}/${label}`;
}

/** AW id for `gtag('config', …)` and the gtag/js URL. */
export function getGoogleAdsAwId(): string | undefined {
  const fromId = sanitizeAwId(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "");
  if (fromId) return fromId;
  const sendTo = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_SEND_TO ?? "";
  const prefix = sendTo.split("/")[0]?.trim() ?? "";
  return sanitizeAwId(prefix);
}

/** Full `send_to` string for the conversion event. */
export function getGoogleAdsConversionSendTo(): string | undefined {
  return sanitizeSendTo(process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_SEND_TO ?? "");
}

type GtagFn = (...args: unknown[]) => void;

/** Fire Google Ads conversion (requires gtag on `window` and a valid `send_to`). */
export function fireGoogleAdsConversion(): void {
  if (typeof window === "undefined") return;
  const sendTo = getGoogleAdsConversionSendTo();
  if (!sendTo) return;
  const gtag = (window as Window & { gtag?: GtagFn }).gtag;
  if (typeof gtag !== "function") return;
  gtag("event", "conversion", { send_to: sendTo });
}
