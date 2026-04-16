"use client";

import { usePathname } from "next/navigation";
import { SMS_CONSENT_FULL_TEXT, SMS_CONSENT_REQUIRED_ERROR } from "@/lib/lead-consent";
import { useSmsConsentLeadForm, type UseSmsConsentLeadFormOptions } from "@/hooks/useSmsConsentLeadForm";

export type SmsConsentLeadFormVariant = "sticky" | "static";

type Props = UseSmsConsentLeadFormOptions & {
  variant: SmsConsentLeadFormVariant;
  /** Extra classes on the outer form element */
  className?: string;
  /** Accessible label for the phone field (unique per page) */
  phoneFieldId?: string;
  /** Sticky bar spec: phone + submit + consent only (default false when sticky). */
  showNameField?: boolean;
};

export default function SmsConsentLeadForm({
  variant,
  className = "",
  defaultSourcePage = "/",
  phoneFieldId = "sms-lead-phone",
  serviceType,
  issueSummary,
  showNameField = variant !== "sticky",
}: Props) {
  const pathname = usePathname();
  const sourcePage = (pathname || defaultSourcePage).slice(0, 2048);
  const f = useSmsConsentLeadForm({ defaultSourcePage, serviceType, issueSummary });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await f.submit();
  };

  const isSticky = variant === "sticky";

  const stickyFieldShell = isSticky
    ? "flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:gap-3"
    : "flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end md:gap-4";

  const inputClass = isSticky
    ? "w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-base text-white placeholder:text-slate-500 shadow-inner outline-none ring-hvac-gold focus:border-hvac-gold focus:ring-2 disabled:opacity-60"
    : "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 shadow-sm outline-none ring-hvac-navy focus:border-hvac-navy focus:ring-2 disabled:opacity-60";

  const consentShellClass = isSticky
    ? `mt-3 rounded-md border px-3 py-2.5 ${
        f.consentError ? "border-red-500 bg-red-950/50" : "border-slate-600/80 bg-slate-900/60"
      }`
    : `mt-4 rounded-md border px-3 py-2.5 ${
        f.consentError ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50"
      }`;

  const consentTextClass = isSticky ? "text-left text-[11px] leading-snug text-slate-200 sm:text-xs" : "text-left text-[11px] leading-snug text-slate-800 sm:text-xs";

  const errClass = isSticky ? "text-red-300" : "text-red-700";

  const successBlock = f.isSuccess ? (
    <div
      className={
        isSticky
          ? "mt-2 rounded-lg border border-emerald-600/40 bg-emerald-950/90 px-4 py-3 text-sm text-emerald-100"
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
      aria-label={variant === "sticky" ? "SMS help request" : "Request HVAC service"}
    >
      <input type="hidden" name="source_page" value={sourcePage} readOnly />

      <div className={stickyFieldShell}>
        <div className="w-full md:max-w-[14rem] md:flex-1">
          <label
            htmlFor={phoneFieldId}
            className={
              isSticky
                ? "mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400"
                : "mb-1 block text-xs font-bold text-slate-700"
            }
          >
            Phone number <span className={isSticky ? "text-red-400" : "text-red-600"}>(required)</span>
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
            <label
              htmlFor={`${phoneFieldId}-name`}
              className={
                isSticky
                  ? "mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400"
                  : "mb-1 block text-xs font-bold text-slate-700"
              }
            >
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

        <div className="w-full md:w-auto md:shrink-0">
          <button
            type="submit"
            disabled={f.isSubmitting || f.isSuccess}
            className={
              isSticky
                ? "w-full rounded-lg bg-hvac-gold px-5 py-2.5 text-center text-base font-black uppercase tracking-wide text-hvac-navy shadow-md transition hover:brightness-110 disabled:opacity-60 md:min-w-[10.5rem]"
                : "w-full rounded-lg bg-hvac-navy px-5 py-2.5 text-center text-base font-black uppercase tracking-wide text-white shadow-md transition hover:bg-hvac-blue disabled:opacity-60 md:min-w-[10.5rem]"
            }
          >
            {f.isSubmitting ? "Sending…" : "Get Help Now"}
          </button>
        </div>
      </div>

      <div className={consentShellClass}>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="sms_consent"
            checked={f.consent}
            onChange={(e) => {
              f.setConsent(e.target.checked);
              if (e.target.checked) f.setConsentError(false);
            }}
            disabled={f.isSubmitting || f.isSuccess}
            className={
              isSticky
                ? "mt-1 h-4 w-4 shrink-0 rounded border-slate-500 text-hvac-gold focus:ring-hvac-gold disabled:opacity-60"
                : "mt-1 h-4 w-4 shrink-0 rounded border-slate-400 text-hvac-navy focus:ring-hvac-navy disabled:opacity-60"
            }
            aria-invalid={f.consentError}
            aria-describedby={f.consentError ? `${phoneFieldId}-consent-err` : undefined}
          />
          <span className={consentTextClass}>{SMS_CONSENT_FULL_TEXT}</span>
        </label>
        {f.consentError ? (
          <p id={`${phoneFieldId}-consent-err`} className={`mt-2 pl-7 text-xs font-semibold ${errClass}`} role="alert">
            {SMS_CONSENT_REQUIRED_ERROR}
          </p>
        ) : null}
      </div>

      {f.serverError ? (
        <p className={`mt-2 text-xs font-semibold ${errClass}`} role="alert">
          {f.serverError}
        </p>
      ) : null}

      {successBlock}
    </form>
  );
}
