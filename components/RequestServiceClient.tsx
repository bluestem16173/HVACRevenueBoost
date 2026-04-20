"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import LeadCard from "@/components/LeadCard";
import {
  LEAD_CARD_PROFILES,
  LEAD_CARD_PROFILE_LABELS,
  type LeadCardProfile,
  isLeadCardProfile,
} from "@/lib/lead-card-profile";

function parseProfileParam(raw: string | null): LeadCardProfile {
  const v = (raw ?? "").trim().toLowerCase().replace(/-/g, "_");
  if (isLeadCardProfile(v)) return v;
  return "hvac_cooling";
}

function RequestServiceInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<LeadCardProfile>(() => parseProfileParam(sp.get("profile")));

  useEffect(() => {
    setProfile(parseProfileParam(sp.get("profile")));
  }, [sp]);

  const syncUrl = useCallback(
    (p: LeadCardProfile) => {
      const params = new URLSearchParams(sp.toString());
      params.set("profile", p);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, sp]
  );

  const selectProfile = (p: LeadCardProfile) => {
    setProfile(p);
    syncUrl(p);
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Service type">
        {LEAD_CARD_PROFILES.map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={profile === p}
            onClick={() => selectProfile(p)}
            className={`rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide transition sm:text-sm ${
              profile === p
                ? "border-hvac-navy bg-hvac-navy text-white shadow"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
            }`}
          >
            {LEAD_CARD_PROFILE_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-lg sm:p-4">
        <LeadCard key={profile} variant="standalone" profile={profile} issue="not_sure" />
      </div>
    </>
  );
}

export default function RequestServiceClient() {
  return (
    <Suspense
      fallback={
        <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" aria-hidden="true" />
      }
    >
      <RequestServiceInner />
    </Suspense>
  );
}
