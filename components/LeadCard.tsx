"use client";

import { useState, useEffect } from "react";

export default function LeadCard({ 
  serviceType = "heating", 
  issue = "wont_turn_on" 
}: { 
  serviceType?: "hvac" | "heating" | "rv_hvac" | "ac";
  issue?: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "submitted">("idle");
  const [selectedIssue, setSelectedIssue] = useState<string>("wont_turn_on");

  const isAC = serviceType === "ac" || serviceType === "hvac";

  const messages: Record<string, { warning: string; sub: string; cta: string }> = {
    no_heat: {
      warning: "Delaying can lead to freezing pipes, water damage, and severe system failure.",
      sub: "Local technicians currently available for dispatch.",
      cta: "Restore Heating Today"
    },
    no_cooling: {
      warning: "Running a broken AC can fry the compressor or cause severe water damage from frozen coils.",
      sub: "Local AC technicians currently available for dispatch.",
      cta: "Restore Cooling Today"
    },
    wont_turn_on: {
      warning: "This points to electrical failure—requires an immediate safe inspection.",
      sub: "Fast, licensed diagnosis available near you.",
      cta: "Get System Checked Now"
    },
    blowing_warm: {
      warning: "Usually low refrigerant or a failed capacitor. Do not run the AC—it will burn out the compressor.",
      sub: "We have experts who can recharge or repair it today.",
      cta: "Fix AC Fast"
    },
    blowing_cold: {
      warning: "Usually a failed limit switch or ignitor. The system is locked out for safety.",
      sub: "We have experts who can clear the lockout.",
      cta: "Fix Cold Air Issue"
    },
    weird_noises: {
      warning: "Grinding or buzzing signals motor failure. Turn off the system immediately.",
      sub: "Local techs can diagnose and prevent further damage.",
      cta: "Request Local Tech"
    },
    not_sure: {
      warning: "We’ll help diagnose the issue and match you with the exact right technician.",
      sub: "No guesswork — just fast, reliable help.",
      cta: "Get Help Now"
    }
  };

  const dynamicContent = messages[selectedIssue as keyof typeof messages] || messages.not_sure;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");

    const form = new FormData(e.currentTarget);

    try {
      await fetch("/api/lead", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          location_raw: form.get("location"),
          urgency: "asap", // Automatically assumed ASAP to reduce friction
          service_type: serviceType,
          issue: form.get("issue") || issue,
          source_page: window.location.pathname,
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
          
          <h2 className="relative z-10 text-3xl font-black text-white mb-2 tracking-tight">Request Received</h2>
          <p className="relative z-10 text-slate-300 font-medium text-sm max-w-[90%] mx-auto leading-relaxed">
            Locating a qualified technician in your ZIP code... we’ll text you shortly to confirm your dispatch.
          </p>
        </div>
        <div className="bg-slate-50 p-6 sm:p-8 flex justify-center items-center border-t border-slate-100">
          <div className="flex items-center gap-3 text-sm font-black text-slate-700 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm uppercase tracking-wide">
             <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
             Verifying Local Availability
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[460px] mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 isolate">
      {/* Premium Header Section */}
      <div className="relative bg-hvac-navy px-6 py-8 text-center">
        {/* Subtle interior glow */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
        {/* Top red/gold accent line for heating urgency */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400"></div>
        
        <h2 className="relative z-10 text-3xl sm:text-[32px] font-black text-white mb-4 tracking-tight drop-shadow-md leading-[1.1]">
          {isAC ? "AC Unresponsive? Get a Technician Out Today" : "Furnace Unresponsive? Get a Technician Out Today"}
        </h2>
        
        <div className="relative z-10 flex justify-center">
          <div className="inline-flex items-center gap-2.5 bg-red-600/30 backdrop-blur-sm border border-red-500/50 px-4 py-2 rounded-lg shadow-inner">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
            <span className="text-white text-xs font-black tracking-widest uppercase">Emergency Service Available</span>
          </div>
        </div>
      </div>

      {/* Interactive Form Section */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-6 bg-white relative z-20">
        
        {/* Diagnostic Intent Row */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-inner">
          <div className="mb-4">
            <label className="block text-[15px] font-black text-slate-900 tracking-tight">
              {isAC ? "What is your AC doing?" : "What is your furnace doing?"}
            </label>
            <p className="text-[12px] text-slate-500 font-bold mt-0.5">Select the closest symptom for faster dispatch</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${selectedIssue === 'wont_turn_on' ? 'border-red-600 bg-red-50/30' : 'border-slate-200 bg-white hover:border-red-300'}`}>
              <input type="radio" name="issue" value="wont_turn_on" checked={selectedIssue === 'wont_turn_on'} onChange={(e) => setSelectedIssue(e.target.value)} className="w-4 h-4 text-red-600 focus:ring-red-600 border-slate-300" />
              <span className={`text-[13px] ${selectedIssue === 'wont_turn_on' ? 'font-black text-red-900' : 'font-bold text-slate-700'}`}>🔌 Won't Turn On</span>
            </label>
            
            {isAC ? (
              <>
                <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${selectedIssue === 'blowing_warm' ? 'border-red-600 bg-red-50/30' : 'border-slate-200 bg-white hover:border-red-300'}`}>
                  <input type="radio" name="issue" value="blowing_warm" checked={selectedIssue === 'blowing_warm'} onChange={(e) => setSelectedIssue(e.target.value)} className="w-4 h-4 text-red-600 focus:ring-red-600 border-slate-300" />
                  <span className={`text-[13px] ${selectedIssue === 'blowing_warm' ? 'font-black text-red-900' : 'font-bold text-slate-700'}`}>🔥 Blowing Warm Air</span>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${selectedIssue === 'no_cooling' ? 'border-red-600 bg-red-50/30' : 'border-slate-200 bg-white hover:border-red-300'}`}>
                  <input type="radio" name="issue" value="no_cooling" checked={selectedIssue === 'no_cooling'} onChange={(e) => setSelectedIssue(e.target.value)} className="w-4 h-4 text-red-600 focus:ring-red-600 border-slate-300" />
                  <span className={`text-[13px] ${selectedIssue === 'no_cooling' ? 'font-black text-red-900' : 'font-bold text-slate-700'}`}>❄️ No Cooling at All</span>
                </label>
              </>
            ) : (
              <>
                <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${selectedIssue === 'blowing_cold' ? 'border-red-600 bg-red-50/30' : 'border-slate-200 bg-white hover:border-red-300'}`}>
                  <input type="radio" name="issue" value="blowing_cold" checked={selectedIssue === 'blowing_cold'} onChange={(e) => setSelectedIssue(e.target.value)} className="w-4 h-4 text-red-600 focus:ring-red-600 border-slate-300" />
                  <span className={`text-[13px] ${selectedIssue === 'blowing_cold' ? 'font-black text-red-900' : 'font-bold text-slate-700'}`}>❄️ Blowing Cold Air</span>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${selectedIssue === 'no_heat' ? 'border-red-600 bg-red-50/30' : 'border-slate-200 bg-white hover:border-red-300'}`}>
                  <input type="radio" name="issue" value="no_heat" checked={selectedIssue === 'no_heat'} onChange={(e) => setSelectedIssue(e.target.value)} className="w-4 h-4 text-red-600 focus:ring-red-600 border-slate-300" />
                  <span className={`text-[13px] ${selectedIssue === 'no_heat' ? 'font-black text-red-900' : 'font-bold text-slate-700'}`}>🔥 No Heat at All</span>
                </label>
              </>
            )}
            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${selectedIssue === 'weird_noises' ? 'border-red-600 bg-red-50/30' : 'border-slate-200 bg-white hover:border-red-300'}`}>
              <input type="radio" name="issue" value="weird_noises" checked={selectedIssue === 'weird_noises'} onChange={(e) => setSelectedIssue(e.target.value)} className="w-4 h-4 text-red-600 focus:ring-red-600 border-slate-300" />
              <span className={`text-[13px] ${selectedIssue === 'weird_noises' ? 'font-black text-red-900' : 'font-bold text-slate-700'}`}>🔊 Weird Noises</span>
            </label>
            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all shadow-sm sm:col-span-2 ${selectedIssue === 'not_sure' ? 'border-red-600 bg-red-50/30' : 'border-slate-200 bg-white hover:border-red-300'}`}>
              <input type="radio" name="issue" value="not_sure" checked={selectedIssue === 'not_sure'} onChange={(e) => setSelectedIssue(e.target.value)} className="w-4 h-4 text-red-600 focus:ring-red-600 border-slate-300" />
              <span className={`text-[13px] ${selectedIssue === 'not_sure' ? 'font-black text-red-900' : 'font-bold text-slate-700'}`}>❓ Not Sure - Need Diagnosis</span>
            </label>
          </div>

          {/* Dynamic Persuasion Block */}
          <div className="mt-4 pt-4 border-t border-slate-200 transition-all duration-300">
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex flex-col gap-2 shadow-sm">
               <p className="text-[13px] font-black flex items-start text-red-900 leading-snug">
                 <span className="text-red-600 mr-2 text-base leading-none">🛑</span>
                 {dynamicContent.warning}
               </p>
               <p className="text-[12px] font-black flex items-center text-green-700 mt-1">
                 <span className="text-green-600 mr-2 text-lg leading-none">✓</span>
                 {dynamicContent.sub}
               </p>
            </div>
          </div>
        </div>

        {/* Rapid Contact Box (Reduced friction layout) */}
        <div className="bg-white border-2 border-slate-100 p-5 rounded-2xl shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <label htmlFor="name" className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">First & Last Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl py-4 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:bg-white transition-all font-bold placeholder-slate-400"
                placeholder="John Doe"
              />
            </div>
            <div className="relative">
               <label htmlFor="phone" className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Mobile Number</label>
               <input
                 id="phone"
                 name="phone"
                 type="tel"
                 required
                 className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl py-4 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:bg-white transition-all font-bold placeholder-slate-400"
                 placeholder="(555) 555-5555"
               />
            </div>
          </div>

          <div className="relative mb-2">
            <label htmlFor="location" className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
              ZIP Code or City
              <button 
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    const input = document.getElementById("location") as HTMLInputElement;
                    if(input) input.value = "Locating..."; 
                    navigator.geolocation.getCurrentPosition(
                      async (pos) => {
                        try {
                          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`);
                          const data = await res.json();
                          if(input) input.value = `${data.city || data.locality}, ${data.principalSubdivision}`;
                        } catch(e) {
                          if(input) input.value = `${pos.coords.latitude}, ${pos.coords.longitude}`;
                        }
                      },
                      () => {
                        if(input) input.value = "";
                      }
                    );
                  }
                }}
                className="text-blue-600 font-black hover:text-blue-800 transition-colors flex items-center gap-1"
              >
                📍 Auto-Locate
              </button>
            </label>
            <input
              id="location"
              name="location"
              type="text"
              required
              className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl py-4 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:bg-white transition-all font-bold placeholder-slate-400"
              placeholder="e.g. 33602"
            />
          </div>
        </div>

        {/* Compressed SMS Consent */}
        <div className="pt-2 px-1">
          <label className="flex items-start gap-3 cursor-pointer group rounded-lg transition-colors">
            <div className="relative flex items-center justify-center mt-1 shrink-0">
              <input type="checkbox" name="sms_consent" required className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-600 shadow-sm transition-all" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed group-hover:text-slate-700">
              I agree to receive text messages verifying dispatch availability. Msg/data rates apply. Reply STOP to opt out.
            </p>
          </label>
        </div>

        {/* Action Button */}
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
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying Availability...
              </span>
            ) : (
              <span className="flex items-center gap-2 uppercase tracking-wide">
                {dynamicContent.cta}
                <svg className="w-6 h-6 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </span>
            )}
          </button>
          
          <div className="flex justify-center items-center gap-4 mt-5 text-[12px] font-black text-slate-500 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><span className="text-green-500 text-sm">✓</span> Verified Pros</span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5"><span className="text-green-500 text-sm">✓</span> Licensed</span>
          </div>
        </div>
      </form>
    </div>
  );
}
