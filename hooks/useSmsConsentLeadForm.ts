"use client";

import { useCallback, useState } from "react";
import { getSmsConsentTextVersion, type SmsConsentSurface } from "@/lib/lead-consent";

export const STICKY_CTA_DISMISS_STORAGE_KEY = "hvacrb-sms-sticky-cta-dismissed";

export const MINIMAL_LEAD_LOCATION_PLACEHOLDER =
  "Not provided — website quick request (ZIP or city not collected on this form)";

export function normalizePhoneDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits.slice(0, 10);
}

export function isValidUsPhoneDigits(digits: string): boolean {
  return digits.length === 10;
}

export function formatPhoneDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export type UseSmsConsentLeadFormOptions = {
  /** Used until `window` is available; also SSR fallback for `source_page`. */
  defaultSourcePage?: string;
  serviceType?: "hvac" | "rv_hvac" | "plumbing" | "electrical";
  /** Which opt-in literal + version to submit (defaults from `serviceType`). */
  consentSurface?: SmsConsentSurface;
  /** Stored on the lead record (issue_description). */
  issueSummary?: string;
};

function consentSurfaceFromServiceType(serviceType: string): SmsConsentSurface {
  if (serviceType === "plumbing") return "plumbing";
  if (serviceType === "electrical") return "electrical";
  return "hvac";
}

export function useSmsConsentLeadForm(options: UseSmsConsentLeadFormOptions = {}) {
  const {
    defaultSourcePage = "/",
    serviceType = "hvac",
    consentSurface: consentSurfaceOpt,
    issueSummary = "Website service request (quick form)",
  } = options;
  const consentSurface = consentSurfaceOpt ?? consentSurfaceFromServiceType(serviceType);

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [consentError, setConsentError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const consentTextVersion = getSmsConsentTextVersion(consentSurface);

  const reset = useCallback(() => {
    setPhone("");
    setName("");
    setConsent(false);
    setPhoneError("");
    setConsentError(false);
    setIsSubmitting(false);
    setIsSuccess(false);
    setServerError("");
  }, []);

  const validate = useCallback(() => {
    const digits = normalizePhoneDigits(phone);
    let ok = true;
    if (!isValidUsPhoneDigits(digits)) {
      setPhoneError("Enter a valid 10-digit US phone number");
      ok = false;
    } else {
      setPhoneError("");
    }
    if (!consent) {
      setConsentError(true);
      ok = false;
    } else {
      setConsentError(false);
    }
    return ok ? digits : null;
  }, [phone, consent]);

  const submit = useCallback(async () => {
    setServerError("");
    if (!consent) {
      setConsentError(true);
      return false;
    }

    const digits = validate();
    if (!digits) return false;

    setIsSubmitting(true);
    const consentAt = new Date().toISOString();
    const page =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search || ""}`
        : defaultSourcePage;

    const trimmedName = name.trim();
    const firstName = trimmedName || "Customer";

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          name: trimmedName || undefined,
          phone: digits,
          location_raw: MINIMAL_LEAD_LOCATION_PLACEHOLDER,
          urgency: "asap",
          service_type:
            serviceType === "rv_hvac"
              ? "rv_hvac"
              : serviceType === "plumbing"
                ? "plumbing"
                : serviceType === "electrical"
                  ? "electrical"
                  : "hvac",
          issue: issueSummary,
          source_page: page.slice(0, 2048),
          sms_consent: true,
          consent_at: consentAt,
          consent_text_version: getSmsConsentTextVersion(consentSurface),
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setServerError(data.error || "Something went wrong. Please try again.");
        return false;
      }

      setIsSuccess(true);
      return true;
    } catch {
      setServerError("Network error. Please try again.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [consent, consentSurface, consentTextVersion, defaultSourcePage, issueSummary, name, serviceType, validate]);

  return {
    phone,
    setPhone,
    name,
    setName,
    consent,
    setConsent,
    phoneError,
    consentError,
    setConsentError,
    setPhoneError,
    isSubmitting,
    isSuccess,
    serverError,
    consentTextVersion,
    validate,
    submit,
    reset,
    normalizePhoneDigits,
    formatPhoneDisplay,
  };
}
