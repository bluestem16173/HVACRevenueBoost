"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  SMS_CONSENT_FULL_TEXT,
  SMS_CONSENT_ORIGINATION_DISCLOSURE,
  SMS_CONSENT_REQUIRED_ERROR,
  SMS_CONSENT_TEXT_VERSION,
  getSmsLeadSubmitButtonLabel,
} from "@/lib/lead-consent";

export default function LeadCard({
  serviceType = "heating",
  issue = "wont_turn_on",
  variant = "embedded",
}: {
  serviceType?: "hvac" | "heating" | "rv_hvac" | "ac";
  issue?: string;
  /** `embedded` = inside modal/card shell. `standalone` = /request-service full-page form (no modal). */
  variant?: "embedded" | "standalone";
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "submitted">("idle");
  const [selectedIssue, setSelectedIssue] = useState<string>(issue);
  const [consentError, setConsentError] = useState(false);
  const [sourcePage, setSourcePage] = useState("");

  useEffect(() => {
    setSourcePage(
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search || ""}`
        : ""
    );
  }, []);

  const isAC = serviceType === "ac" || serviceType === "hvac";

  const messages: Record<string, { warning: string; sub: string; cta: string }> = {
    no_heat: {
      warning:
        "Delaying can lead to freezing pipes, water damage, and severe system failure.",
      sub: "Local technicians currently available for dispatch.",
      cta: "Restore Heating Today",
    },
    no_cooling: {
      warning:
        "Running a broken AC can fry the compressor or cause severe water damage from frozen coils.",
      sub: "Local AC technicians currently available for dispatch.",
      cta: "Restore Cooling Today",
    },
    wont_turn_on: {
      warning: "This points to electrical failure—requires an immediate safe inspection.",
      sub: "Fast, licensed diagnosis available near you.",
      cta: "Get System Checked Now",
    },
    blowing_warm: {
      warning:
        "Usually low refrigerant or a failed capacitor. Do not run the AC—it will burn out the compressor.",
      sub: "We have experts who can recharge or repair it today.",
      cta: "Fix AC Fast",
    },
    blowing_cold: {
      warning:
        "Usually a failed limit switch or ignitor. The system is locked out for safety.",
      sub: "We have experts who can clear the lockout.",
      cta: "Fix Cold Air Issue",
    },
    weird_noises: {
      warning: "Grinding or buzzing signals motor failure. Turn off the system immediately.",
      sub: "Local techs can diagnose and prevent further damage.",
      cta: "Request Local Tech",
    },
    not_sure: {
      warning: "We’ll help diagnose the issue and match you with the exact right technician.",
      sub: "No guesswork — just fast, reliable help.",
      cta: "Get Help Now",
    },
  };

  const dynamicContent =
    messages[selectedIssue as keyof typeof messages] || messages.not_sure;

  function normalizePhone(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
    return digits.slice(0, 10);
  }

  function formatPhoneDisplay(digits: string): string {
    const d = digits.replace(/\D/g, "").slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setConsentError(false);

    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const fd = new FormData(form);
    const smsConsent = fd.get("sms_consent") === "on";

    if (!smsConsent) {
      setConsentError(true);
      return;
    }

    const firstName = String(fd.get("first_name") || "").trim();
    const phoneRaw = String(fd.get("phone") || "").trim();
    const phoneDigits = normalizePhone(phoneRaw);

    if (!firstName || phoneDigits.length < 10) {
      return;
    }

    setStatus("loading");

    const consentAt = new Date().toISOString();
    const apiServiceType = serviceType === "rv_hvac" ? "rv_hvac" : "hvac";

    try {
      await fetch("/api/lead", {
        method: "POST",
        body: JSON.stringify({
          first_name: firstName,
          phone: phoneDigits,
          location_raw: fd.get("location"),
          urgency: "asap",
          service_type: apiServiceType,
          issue: fd.get("issue") || selectedIssue,
          source_page: fd.get("source_page") || sourcePage || "/",
          sms_consent: true,
          consent_at: consentAt,
          consent_text_version: SMS_CONSENT_TEXT_VERSION,
        }),
        headers: { "Content-Type": "application/json" },
      });

      setTimeout(() => setStatus("submitted"), 800);
    } catch (error) {
      console.error(error);
      setStatus("submitted");
    }
  }

  if (status === "submitted") {
    return (
      <div className="w-full max-w-[460px] mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-hvac-navy px-8 py-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-hvac-gold to-yellow-500"></div>

          <div className="relative z-10 w-24 h-24 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/20">
            <div className="w-16 h-16 bg-hvac-gold rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(252,211,77,0.6)]">
              <svg className="w-8 h-8 text-hvac-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h2 className="relative z-10 text-3xl font-black text-white mb-2 tracking-tight">
            Request received
          </h2>
          <p className="relative z-10 text-slate-300 font-medium text-sm max-w-[90%] mx-auto leading-relaxed">
            We will contact you using the phone number you provided about your inquiry, including scheduling and
            service coordination. If you opted in to SMS, messages are only for that purpose—reply STOP to opt out at
            any time.
          </p>
        </div>
        <div className="bg-slate-50 p-6 sm:p-8 flex justify-center items-center border-t border-slate-100">
          <div className="flex items-center gap-3 text-sm font-black text-slate-700 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm uppercase tracking-wide">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            Verifying local availability
          </div>
        </div>
      </div>
    );
  }

  const headerBlock =
    variant === "standalone" ? (
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
          Request HVAC service
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Same secure form used across the site. For inquiry response, scheduling, and service coordination only—not
          marketing blasts.
        </p>
      </div>
    ) : null;

  const cardInner = (
    <div className="w-full max-w-[460px] mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 isolate">
      {variant === "embedded" ? (
        <div className="relative bg-hvac-navy px-6 py-8 text-center">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400"></div>

          <h2 className="relative z-10 text-3xl sm:text-[32px] font-black text-white mb-3 tracking-tight drop-shadow-md leading-[1.1]">
            {isAC ? "Get HVAC Help Now" : "Furnace Unresponsive? Get a Technician Out Today"}
          </h2>

          {isAC ? (
            <p className="relative z-10 mx-auto mb-4 max-w-md text-sm font-medium leading-relaxed text-slate-200">
              A technician will contact you about your issue and next steps.
            </p>
          ) : null}

          <div className="relative z-10 flex justify-center">
            <div className="inline-flex items-center gap-2.5 bg-red-600/30 backdrop-blur-sm border border-red-500/50 px-4 py-2 rounded-lg shadow-inner">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
              <span className="text-white text-xs font-black tracking-widest uppercase">
                Emergency service available
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative bg-hvac-navy px-6 py-6 text-center border-b border-slate-800">
          <h2 className="relative z-10 text-xl sm:text-2xl font-black text-white tracking-tight">
            HVAC service request
          </h2>
          <p className="relative z-10 text-slate-300 text-xs mt-2 font-medium">
            Inquiry · scheduling · service updates (SMS only with consent below)
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-6 bg-white relative z-20" noValidate>
        <input type="hidden" name="source_page" value={sourcePage || "/request-service"} readOnly />

        {isAC ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-snug text-amber-950">
            This issue can escalate quickly if the system keeps running.
          </p>
        ) : null}

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-inner">
          <div className="mb-4">
            <label className="block text-[15px] font-black text-slate-900 tracking-tight">
              {isAC ? "What is your AC doing?" : "What is your furnace doing?"}
            </label>
            <p className="text-[12px] text-slate-500 font-bold mt-0.5">
              Select the closest symptom for faster dispatch
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${selectedIssue === "wont_turn_on" ? "border-red-600 bg-red-50/30" : "border-slate-200 bg-white hover:border-red-300"}`}
            >
              <input
                type="radio"
                name="issue"
                value="wont_turn_on"
                checked={selectedIssue === "wont_turn_on"}
                onChange={(e) => setSelectedIssue(e.target.value)}
                className="w-4 h-4 text-red-600 focus:ring-red-600 border-slate-300"
              />
              <span
                className={`text-[13px] ${selectedIssue === "wont_turn_on" ? "font-black text-red-900" : "font-bold text-slate-700"}`}
              >
                Won&apos;t turn on
              </span>
            </label>

            {isAC ? (
              <>
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${selectedIssue === "blowing_warm" ? "border-red-600 bg-red-50/30" : "border-slate-200 bg-white hover:border-red-300"}`}
                >
                  <input
                    type="radio"
                    name="issue"
                    value="blowing_warm"
                    checked={selectedIssue === "blowing_warm"}
                    onChange={(e) => setSelectedIssue(e.target.value)}
                    className="w-4 h-4 text-red-600 focus:ring-red-600 border-slate-300"
                  />
                  <span
                    className={`text-[13px] ${selectedIssue === "blowing_warm" ? "font-black text-red-900" : "font-bold text-slate-700"}`}
                  >
                    Blowing warm air
                  </span>
                </label>
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${selectedIssue === "no_cooling" ? "border-red-600 bg-red-50/30" : "border-slate-200 bg-white hover:border-red-300"}`}
                >
                  <input
                    type="radio"
                    name="issue"
                    value="no_cooling"
                    checked={selectedIssue === "no_cooling"}
                    onChange={(e) => setSelectedIssue(e.target.value)}
                    className="w-4 h-4 text-red-600 focus:ring-red-600 border-slate-300"
                  />
                  <span
                    className={`text-[13px] ${selectedIssue === "no_cooling" ? "font-black text-red-900" : "font-bold text-slate-700"}`}
                  >
                    No cooling at all
                  </span>
                </label>
              </>
            ) : (
              <>
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${selectedIssue === "blowing_cold" ? "border-red-600 bg-red-50/30" : "border-slate-200 bg-white hover:border-red-300"}`}
                >
                  <input
                    type="radio"
                    name="issue"
                    value="blowing_cold"
                    checked={selectedIssue === "blowing_cold"}
                    onChange={(e) => setSelectedIssue(e.target.value)}
                    className="w-4 h-4 text-red-600 focus:ring-red-600 border-slate-300"
                  />
                  <span
                    className={`text-[13px] ${selectedIssue === "blowing_cold" ? "font-black text-red-900" : "font-bold text-slate-700"}`}
                  >
                    Blowing cold air
                  </span>
                </label>
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${selectedIssue === "no_heat" ? "border-red-600 bg-red-50/30" : "border-slate-200 bg-white hover:border-red-300"}`}
                >
                  <input
                    type="radio"
                    name="issue"
                    value="no_heat"
                    checked={selectedIssue === "no_heat"}
                    onChange={(e) => setSelectedIssue(e.target.value)}
                    className="w-4 h-4 text-red-600 focus:ring-red-600 border-slate-300"
                  />
                  <span
                    className={`text-[13px] ${selectedIssue === "no_heat" ? "font-black text-red-900" : "font-bold text-slate-700"}`}
                  >
                    No heat at all
                  </span>
                </label>
              </>
            )}
            <label
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${selectedIssue === "weird_noises" ? "border-red-600 bg-red-50/30" : "border-slate-200 bg-white hover:border-red-300"}`}
            >
              <input
                type="radio"
                name="issue"
                value="weird_noises"
                checked={selectedIssue === "weird_noises"}
                onChange={(e) => setSelectedIssue(e.target.value)}
                className="w-4 h-4 text-red-600 focus:ring-red-600 border-slate-300"
              />
              <span
                className={`text-[13px] ${selectedIssue === "weird_noises" ? "font-black text-red-900" : "font-bold text-slate-700"}`}
              >
                Weird noises
              </span>
            </label>
            <label
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all shadow-sm sm:col-span-2 ${selectedIssue === "not_sure" ? "border-red-600 bg-red-50/30" : "border-slate-200 bg-white hover:border-red-300"}`}
            >
              <input
                type="radio"
                name="issue"
                value="not_sure"
                checked={selectedIssue === "not_sure"}
                onChange={(e) => setSelectedIssue(e.target.value)}
                className="w-4 h-4 text-red-600 focus:ring-red-600 border-slate-300"
              />
              <span
                className={`text-[13px] ${selectedIssue === "not_sure" ? "font-black text-red-900" : "font-bold text-slate-700"}`}
              >
                Not sure — need diagnosis
              </span>
            </label>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 transition-all duration-300">
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex flex-col gap-2 shadow-sm">
              <p className="text-[13px] font-black flex items-start text-red-900 leading-snug">
                <span className="text-red-600 mr-2 text-base leading-none">!</span>
                {dynamicContent.warning}
              </p>
              <p className="text-[12px] font-black flex items-center text-green-700 mt-1">
                <span className="text-green-600 mr-2 text-lg leading-none">✓</span>
                {dynamicContent.sub}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-100 p-5 rounded-2xl shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="relative sm:col-span-1">
              <label
                htmlFor="first_name"
                className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2"
              >
                First name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                autoComplete="given-name"
                className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl py-4 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:bg-white transition-all font-bold placeholder-slate-400"
                placeholder="John"
              />
            </div>
            <div className="relative sm:col-span-1">
              <label
                htmlFor="phone"
                className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2"
              >
                Phone number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                required
                pattern="[\d\s\-\+\(\)]{10,}"
                title="Enter a valid 10-digit US phone number"
                className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl py-4 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:bg-white transition-all font-bold placeholder-slate-400"
                placeholder="(555) 555-5555"
                onBlur={(e) => {
                  const d = normalizePhone(e.target.value);
                  if (d.length === 10) e.target.value = formatPhoneDisplay(d);
                }}
              />
            </div>
          </div>

          <div className="relative mb-2">
            <label
              htmlFor="location"
              className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 flex justify-between"
            >
              ZIP or city
              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    const input = document.getElementById("location") as HTMLInputElement;
                    if (input) input.value = "Locating...";
                    navigator.geolocation.getCurrentPosition(
                      async (pos) => {
                        try {
                          const res = await fetch(
                            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
                          );
                          const data = await res.json();
                          if (input)
                            input.value = `${data.city || data.locality}, ${data.principalSubdivision}`;
                        } catch {
                          if (input) input.value = `${pos.coords.latitude}, ${pos.coords.longitude}`;
                        }
                      },
                      () => {
                        if (input) input.value = "";
                      }
                    );
                  }
                }}
                className="text-blue-600 font-black hover:text-blue-800 transition-colors flex items-center gap-1"
              >
                Auto-locate
              </button>
            </label>
            <input
              id="location"
              name="location"
              type="text"
              required
              autoComplete="postal-code"
              className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl py-4 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:bg-white transition-all font-bold placeholder-slate-400"
              placeholder="e.g. 33602 or Tampa, FL"
            />
          </div>
        </div>

        <div className="pt-2 px-1 space-y-3">
          <div
            className={`rounded-lg border p-3 ${consentError ? "border-red-500 bg-red-50" : "border-transparent"}`}
            role="group"
            aria-labelledby="sms-consent-label"
          >
            <label id="sms-consent-label" className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-1 shrink-0">
                <input
                  type="checkbox"
                  name="sms_consent"
                  value="on"
                  required
                  className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-600 shadow-sm"
                  aria-invalid={consentError}
                  aria-required="true"
                  onChange={() => consentError && setConsentError(false)}
                />
              </div>
              <span className="text-sm text-slate-700 font-medium leading-relaxed">{SMS_CONSENT_FULL_TEXT}</span>
            </label>
            <p className="mt-3 pl-8 text-[11px] text-slate-600 font-medium leading-relaxed">{SMS_CONSENT_ORIGINATION_DISCLOSURE}</p>
            <div className="mt-3 pl-8 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold">
              <Link href="/privacy" className="text-blue-700 underline hover:text-blue-900">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-blue-700 underline hover:text-blue-900">
                Terms & Conditions
              </Link>
            </div>
          </div>
          {consentError ? (
            <p className="text-sm font-bold text-red-700" role="alert">
              {SMS_CONSENT_REQUIRED_ERROR}
            </p>
          ) : null}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xl py-5 rounded-xl transition-all shadow-[0_4px_14px_rgba(220,38,38,0.4)] hover:shadow-[0_8px_20px_rgba(220,38,38,0.6)] disabled:opacity-75 flex items-center justify-center gap-3 transform hover:-translate-y-1 active:translate-y-0"
          >
            {status === "loading" ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Verifying availability...
              </span>
            ) : (
              <span className="flex items-center gap-2 uppercase tracking-wide">
                {isAC ? getSmsLeadSubmitButtonLabel() : dynamicContent.cta}
                <svg className="w-6 h-6 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            )}
          </button>

          <div className="flex justify-center items-center gap-4 mt-5 text-[12px] font-black text-slate-500 uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <span className="text-green-500 text-sm">✓</span> Verified pros
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5">
              <span className="text-green-500 text-sm">✓</span> Licensed
            </span>
          </div>
        </div>
      </form>
    </div>
  );

  if (variant === "standalone") {
    return (
      <div>
        {headerBlock}
        {cardInner}
      </div>
    );
  }

  return cardInner;
}
