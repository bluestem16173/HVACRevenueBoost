"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  SMS_CONSENT_OPT_IN_LEAD,
  SMS_CONSENT_ORIGINATION_DISCLOSURE,
  SMS_CONSENT_REQUIRED_ERROR,
  SMS_CONSENT_SAMPLE_MESSAGE,
  getSmsConsentFullText,
  getSmsLeadSubmitButtonLabel,
  type SmsConsentSurface,
} from "@/lib/lead-consent";
import { useSmsConsentLeadForm, type UseSmsConsentLeadFormOptions } from "@/hooks/useSmsConsentLeadForm";
import { SmsLegalFooterLinks } from "@/components/SmsLegalFooterLinks";
import { getLeadAttributionFromPathname, readUtmParamsFromSearch } from "@/lib/lead-attribution-from-pathname";

export type SmsConsentLeadFormVariant = "sticky" | "static";

type Props = UseSmsConsentLeadFormOptions & {
  variant: SmsConsentLeadFormVariant;
  /** Extra classes on the outer form element */
  className?: string;
  /** Accessible label for the phone field (unique per page) */
  phoneFieldId?: string;
  /** Sticky bar spec: phone + submit + consent only (default false when sticky). */
  showNameField?: boolean;
  /** Sticky CTA label (ad creative). Static variant ignores this and uses {@link getSmsLeadSubmitButtonLabel}. */
  submitButtonLabel?: string;
  /** Overrides default form `aria-label` (e.g. trade-specific sticky bar). */
  formAriaLabel?: string;
};

function resolvedConsentSurface(
  serviceType: UseSmsConsentLeadFormOptions["serviceType"],
  explicit?: SmsConsentSurface
): SmsConsentSurface {
  if (explicit) return explicit;
  if (serviceType === "plumbing") return "plumbing";
  if (serviceType === "electrical") return "electrical";
  return "hvac";
}

export default function SmsConsentLeadForm({
  variant,
  className = "",
  defaultSourcePage = "/",
  phoneFieldId = "sms-lead-phone",
  serviceType,
  consentSurface,
  issueSummary,
  showNameField = variant !== "sticky",
  submitButtonLabel,
  formAriaLabel,
}: Props) {
  const pathname = usePathname();
  /** `usePathname()` may be null during SSR; using pathname in the first paint mismatches the client. */
  const [pathReady, setPathReady] = useState(false);
  useEffect(() => {
    setPathReady(true);
  }, []);
  const sourcePage = (pathReady ? (pathname || defaultSourcePage) : defaultSourcePage).slice(0, 2048);
  const consentSurfaceResolved = resolvedConsentSurface(serviceType, consentSurface);
  const consentCheckboxText = getSmsConsentFullText(consentSurfaceResolved);

  const buildAttribution = useCallback(() => {
    const pathOnly = (pathReady ? pathname || defaultSourcePage : defaultSourcePage).split("?")[0] || "/";
    const attr = getLeadAttributionFromPathname(pathOnly);
    const u =
      typeof window !== "undefined"
        ? readUtmParamsFromSearch(window.location.search)
        : { utm_source: "", utm_campaign: "", utm_term: "" };
    return {
      page_slug: attr.page_slug,
      page_city_slug: attr.city,
      trade: attr.trade,
      utm_source: u.utm_source,
      utm_campaign: u.utm_campaign,
      utm_term: u.utm_term,
    };
  }, [pathReady, pathname, defaultSourcePage]);

  const f = useSmsConsentLeadForm({
    defaultSourcePage,
    serviceType,
    consentSurface: consentSurfaceResolved,
    issueSummary,
    buildAttribution,
  });

  const hiddenAttr = buildAttribution();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await f.submit();
  };

  const isSticky = variant === "sticky";
  const stickySubmit = (submitButtonLabel ?? "GET HELP NOW").trim() || "GET HELP NOW";
  const resolvedFormAria =
    (formAriaLabel ?? "").trim() ||
    (variant === "sticky" ? "SMS help request" : "Request HVAC service");

  const inputsRowClass = isSticky
    ? "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3"
    : "flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end md:gap-4";

  const inputClass = isSticky
    ? "w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none ring-slate-400 focus:border-slate-500 focus:ring-1 disabled:opacity-60"
    : "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 shadow-sm outline-none ring-hvac-navy focus:border-hvac-navy focus:ring-2 disabled:opacity-60";

  const consentShellClass = isSticky
    ? `mt-2 rounded-md border px-2 py-2 ${
        f.consentError ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
      }`
    : `mt-4 rounded-md border px-3 py-3 ${
        f.consentError ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50"
      }`;

  const consentTextClass = isSticky
    ? "text-left text-[10px] leading-tight text-slate-900 sm:text-[11px] sm:leading-snug"
    : "text-left text-sm leading-snug text-slate-800";

  const consentCheckboxLabel =
    consentCheckboxText.startsWith(SMS_CONSENT_OPT_IN_LEAD) ? (
      <>
        <strong className="font-black text-slate-900">{SMS_CONSENT_OPT_IN_LEAD}</strong>
        {consentCheckboxText.slice(SMS_CONSENT_OPT_IN_LEAD.length)}
      </>
    ) : (
      consentCheckboxText
    );

  const errClass = isSticky ? "text-red-600" : "text-red-700";

  const successBlock = f.isSuccess ? (
    <div
      className={
        isSticky
          ? "mt-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1.5 text-[10px] leading-snug text-emerald-900 sm:text-xs"
          : "mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
      }
      role="status"
    >
      Thanks — we received your request and will follow up about your inquiry, scheduling, and service updates.
    </div>
  ) : null;

  return (
    <form
      onSubmit={onSubmit}
      className={className}
      noValidate
      aria-label={resolvedFormAria}
    >
      <input type="hidden" name="source_page" value={sourcePage} readOnly />
      <input type="hidden" name="page_slug" value={hiddenAttr.page_slug} readOnly />
      <input type="hidden" name="city" value={hiddenAttr.page_city_slug} readOnly />
      <input type="hidden" name="trade" value={hiddenAttr.trade} readOnly />
      <input type="hidden" name="utm_source" value={hiddenAttr.utm_source} readOnly />
      <input type="hidden" name="utm_campaign" value={hiddenAttr.utm_campaign} readOnly />
      <input type="hidden" name="utm_term" value={hiddenAttr.utm_term} readOnly />

      {isSticky ? (
        <div className="min-w-0">
          <div className="w-full">
            <label
              htmlFor={phoneFieldId}
              className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-red-600"
            >
              Phone (required)
            </label>
            <input
              id={phoneFieldId}
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={f.phone}
              onChange={(e) => {
                f.setPhone(e.target.value);
                if (f.phoneError) f.setPhoneError("");
              }}
              onBlur={(e) => {
                const d = f.normalizePhoneDigits(e.target.value);
                if (d.length === 10) f.setPhone(f.formatPhoneDisplay(d));
              }}
              disabled={f.isSubmitting || f.isSuccess}
              placeholder="Phone number"
              className={inputClass}
              aria-invalid={Boolean(f.phoneError)}
              aria-describedby={f.phoneError ? `${phoneFieldId}-err` : undefined}
            />
            {f.phoneError ? (
              <p id={`${phoneFieldId}-err`} className={`mt-0.5 text-[10px] font-semibold ${errClass}`} role="alert">
                {f.phoneError}
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className={inputsRowClass}>
          <div className="w-full md:max-w-[14rem] md:flex-1">
            <label htmlFor={phoneFieldId} className="mb-1 block text-xs font-bold text-slate-700">
              Phone number <span className="text-red-600">(required)</span>
            </label>
            <input
              id={phoneFieldId}
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={f.phone}
              onChange={(e) => {
                f.setPhone(e.target.value);
                if (f.phoneError) f.setPhoneError("");
              }}
              onBlur={(e) => {
                const d = f.normalizePhoneDigits(e.target.value);
                if (d.length === 10) f.setPhone(f.formatPhoneDisplay(d));
              }}
              disabled={f.isSubmitting || f.isSuccess}
              placeholder="Phone number"
              className={inputClass}
              aria-invalid={Boolean(f.phoneError)}
              aria-describedby={f.phoneError ? `${phoneFieldId}-err` : undefined}
            />
            {f.phoneError ? (
              <p id={`${phoneFieldId}-err`} className={`mt-1 text-xs font-semibold ${errClass}`} role="alert">
                {f.phoneError}
              </p>
            ) : null}
          </div>

          {showNameField ? (
            <div className="w-full md:max-w-[12rem] md:flex-1">
              <label htmlFor={`${phoneFieldId}-name`} className="mb-1 block text-xs font-bold text-slate-700">
                Name <span className="font-medium normal-case text-slate-500">(optional)</span>
              </label>
              <input
                id={`${phoneFieldId}-name`}
                name="name"
                type="text"
                autoComplete="name"
                value={f.name}
                onChange={(e) => f.setName(e.target.value)}
                disabled={f.isSubmitting || f.isSuccess}
                placeholder="Name (optional)"
                className={inputClass}
              />
            </div>
          ) : null}
        </div>
      )}

      <div className={consentShellClass}>
        <label className="flex cursor-pointer items-start gap-2 sm:gap-3">
          <input
            type="checkbox"
            name="sms_consent"
            checked={f.consent}
            onChange={(e) => {
              f.setConsent(e.target.checked);
              if (e.target.checked) f.setConsentError(false);
            }}
            disabled={f.isSubmitting || f.isSuccess}
            required
            aria-required="true"
            className={
              isSticky
                ? "mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-slate-400 text-hvac-navy focus:ring-hvac-navy disabled:opacity-60 sm:mt-1.5 sm:h-4 sm:w-4"
                : "mt-1.5 h-4 w-4 shrink-0 rounded border-slate-400 text-hvac-navy focus:ring-hvac-navy disabled:opacity-60"
            }
            aria-invalid={f.consentError}
            aria-describedby={f.consentError ? `${phoneFieldId}-consent-err` : undefined}
          />
          <span className={consentTextClass}>{consentCheckboxLabel}</span>
        </label>
        {!isSticky ? (
          <>
            <p className="mt-2 pl-7 text-left text-xs leading-snug text-slate-600">
              <span className="font-semibold text-slate-700">Consent description: </span>
              {SMS_CONSENT_ORIGINATION_DISCLOSURE}
            </p>
            <p className="mt-2 pl-7 text-left text-xs leading-snug text-slate-600">
              <span className="font-semibold text-slate-700">Sample message: </span>
              {SMS_CONSENT_SAMPLE_MESSAGE}
            </p>
          </>
        ) : null}
        <SmsLegalFooterLinks
          className={
            isSticky ? "mt-1.5 pl-6 text-[10px] sm:pl-7 sm:text-[11px]" : "mt-2 pl-7 text-xs"
          }
        />
        {f.consentError ? (
          <p id={`${phoneFieldId}-consent-err`} className={`mt-2 pl-7 text-sm font-semibold ${errClass}`} role="alert">
            {SMS_CONSENT_REQUIRED_ERROR}
          </p>
        ) : null}
      </div>

      {isSticky ? (
        <button
          type="submit"
          disabled={f.isSubmitting || f.isSuccess}
          className="mt-2 w-full rounded-md bg-hvac-gold px-4 py-2 text-center text-xs font-black uppercase tracking-wide text-hvac-navy shadow-sm transition hover:brightness-105 disabled:opacity-60 sm:text-sm"
        >
          {f.isSubmitting ? "Sending…" : stickySubmit}
        </button>
      ) : (
        <div className="mt-4 flex flex-col gap-2 md:flex-row md:justify-end">
          <button
            type="submit"
            disabled={f.isSubmitting || f.isSuccess}
            className="w-full rounded-lg bg-hvac-navy px-5 py-2.5 text-center text-base font-black uppercase tracking-wide text-white shadow-md transition hover:bg-hvac-blue disabled:opacity-60 md:min-w-[10.5rem]"
          >
            {f.isSubmitting ? "Sending…" : getSmsLeadSubmitButtonLabel()}
          </button>
        </div>
      )}

      {f.serverError ? (
        <p className={`mt-2 text-xs font-semibold ${errClass}`} role="alert">
          {f.serverError}
        </p>
      ) : null}

      {successBlock}
    </form>
  );
}
