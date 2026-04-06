"use client";

import { useState } from "react";

export default function LeadCard({ 
  serviceType = "hvac", 
  issue = "general_inquiry" 
}: { 
  serviceType?: "hvac" | "rv_hvac";
  issue?: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "submitted">("idle");
  const [selectedIssue, setSelectedIssue] = useState<string>("not_cooling");

  const messages: Record<string, { warning: string; sub: string; cta: string }> = {
    not_cooling: {
      warning: "Running your AC like this can damage the compressor — a $2,000+ repair",
      sub: "Technicians are available for cooling issues in your area",
      cta: "Fix Cooling Issue Now"
    },
    not_turning_on: {
      warning: "This could be an electrical issue — delaying can cause system failure",
      sub: "Fast diagnosis available near you",
      cta: "Get System Checked Now"
    },
    weak_airflow: {
      warning: "Restricted airflow can overheat your system and lead to breakdown",
      sub: "Quick fixes available if caught early",
      cta: "Restore Airflow Today"
    },
    blowing_warm: {
      warning: "Warm air often signals refrigerant or compressor issues — don’t wait",
      sub: "Local techs can diagnose this quickly",
      cta: "Check Availability Now"
    },
    not_sure: {
      warning: "We’ll help diagnose the issue and match you with the right technician",
      sub: "No guesswork — just fast help",
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
          urgency: form.get("timing"),
          service_type: serviceType,
          issue: form.get("issue") || issue,
          source_page: window.location.pathname,
        }),
        headers: { "Content-Type": "application/json" },
      });
      
      // Artificial delay for better perceived UX
      setTimeout(() => setStatus("submitted"), 800);
    } catch (error) {
      console.error(error);
      // Fallback to submitted regardless for UX demo purposes
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
            Checking local availability... we’ll text you shortly to confirm your dispatch.
          </p>
        </div>
        <div className="bg-slate-50 p-6 sm:p-8 flex justify-center items-center border-t border-slate-100">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-500 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
             <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
             System processing your request seamlessly.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[460px] mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 isolate">
      {/* Premium Header Section */}
      <div className="relative bg-hvac-navy px-8 py-10 text-center">
        {/* Subtle interior glow */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
        {/* Top gold accent line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-hvac-gold via-yellow-400 to-hvac-gold"></div>
        
        {/* Dispatch Ready Badge */}
        <div className="relative z-10 flex justify-center mb-6">
          <div className="inline-flex items-center gap-2.5 bg-black/20 backdrop-blur-sm border border-white/10 px-4 py-1.5 rounded-full shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full bg-hvac-gold animate-pulse shadow-[0_0_8px_rgba(252,211,77,0.8)]"></span>
            <span className="text-white/90 text-xs font-bold tracking-widest uppercase mt-px">Technicians Available</span>
          </div>
        </div>
        
        <h2 className="relative z-10 text-3xl sm:text-[34px] font-black text-white mb-3.5 tracking-tight drop-shadow-md leading-[1.15]">AC Not Working? Get a Technician Out Today</h2>
        <div className="relative z-10 flex flex-col gap-2 max-w-[95%] mx-auto">
          <p className="text-hvac-gold uppercase tracking-widest text-[11px] font-black drop-shadow-sm flex items-center justify-center gap-1.5 bg-black/20 w-fit mx-auto px-3 py-1.5 rounded-full border border-white/5 transition-all">
            <span className="text-[14px] leading-none mb-0.5">⚠️</span> Limited same-day availability
          </p>
          <p className="text-slate-200 font-medium text-[14px] leading-relaxed mt-0.5 transition-all duration-300">
            <span className="text-yellow-400 font-bold">⚠️ Don’t wait</span> — small AC issues can turn into $2,000 repairs.
          </p>
        </div>
      </div>

      {/* Interactive Form Section */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 bg-white relative z-20">
        
        {/* Solution Engine Prompt */}
        <div className="text-center mb-2 pb-1 border-b border-slate-100">
          <p className="text-sm font-black text-slate-800 tracking-wide pb-2">Tell us what’s going on — we’ll match you instantly</p>
        </div>

        {/* Diagnostic Intent Row */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl shadow-sm">
          <div className="mb-3 ml-0.5">
            <label className="block text-[14px] font-black text-slate-800 tracking-tight">
              What’s wrong with your AC?
            </label>
            <p className="text-[11.5px] text-slate-500 font-bold mt-0.5">Select the closest issue</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all shadow-sm relative overflow-hidden group ${selectedIssue === 'not_cooling' ? 'border-hvac-navy bg-hvac-navy/5' : 'border-slate-200 bg-white hover:border-hvac-navy/30'}`}>
              <input type="radio" name="issue" value="not_cooling" checked={selectedIssue === 'not_cooling'} onChange={(e) => setSelectedIssue(e.target.value)} className="w-4 h-4 text-hvac-navy focus:ring-hvac-navy border-slate-300" />
              <span className={`text-[13px] ${selectedIssue === 'not_cooling' ? 'font-extrabold text-hvac-navy' : 'font-semibold text-slate-700'}`}>❄️ Not cooling</span>
            </label>
            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all shadow-sm relative overflow-hidden group ${selectedIssue === 'not_turning_on' ? 'border-hvac-navy bg-hvac-navy/5' : 'border-slate-200 bg-white hover:border-hvac-navy/30'}`}>
              <input type="radio" name="issue" value="not_turning_on" checked={selectedIssue === 'not_turning_on'} onChange={(e) => setSelectedIssue(e.target.value)} className="w-4 h-4 text-hvac-navy focus:ring-hvac-navy border-slate-300" />
              <span className={`text-[13px] ${selectedIssue === 'not_turning_on' ? 'font-extrabold text-hvac-navy' : 'font-semibold text-slate-700'}`}>🔌 Not turning on</span>
            </label>
            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all shadow-sm relative overflow-hidden group ${selectedIssue === 'weak_airflow' ? 'border-hvac-navy bg-hvac-navy/5' : 'border-slate-200 bg-white hover:border-hvac-navy/30'}`}>
              <input type="radio" name="issue" value="weak_airflow" checked={selectedIssue === 'weak_airflow'} onChange={(e) => setSelectedIssue(e.target.value)} className="w-4 h-4 text-hvac-navy focus:ring-hvac-navy border-slate-300" />
              <span className={`text-[13px] ${selectedIssue === 'weak_airflow' ? 'font-extrabold text-hvac-navy' : 'font-semibold text-slate-700'}`}>💨 Weak airflow</span>
            </label>
            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all shadow-sm relative overflow-hidden group ${selectedIssue === 'blowing_warm' ? 'border-hvac-navy bg-hvac-navy/5' : 'border-slate-200 bg-white hover:border-hvac-navy/30'}`}>
              <input type="radio" name="issue" value="blowing_warm" checked={selectedIssue === 'blowing_warm'} onChange={(e) => setSelectedIssue(e.target.value)} className="w-4 h-4 text-hvac-navy focus:ring-hvac-navy border-slate-300" />
              <span className={`text-[13px] ${selectedIssue === 'blowing_warm' ? 'font-extrabold text-hvac-navy' : 'font-semibold text-slate-700'}`}>🌡️ Blowing warm</span>
            </label>
            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all shadow-sm sm:col-span-2 relative overflow-hidden group ${selectedIssue === 'not_sure' ? 'border-hvac-navy bg-hvac-navy/5' : 'border-slate-200 bg-white hover:border-hvac-navy/30'}`}>
              <input type="radio" name="issue" value="not_sure" checked={selectedIssue === 'not_sure'} onChange={(e) => setSelectedIssue(e.target.value)} className="w-4 h-4 text-hvac-navy focus:ring-hvac-navy border-slate-300" />
              <span className={`text-[13px] ${selectedIssue === 'not_sure' ? 'font-extrabold text-hvac-navy' : 'font-semibold text-slate-700'}`}>❓ Not sure</span>
            </label>
          </div>

          {/* Dynamic Persuasion Block */}
          <div className="mt-3.5 pt-4 border-t border-slate-200/60 transition-all duration-300">
            <div className="bg-red-50/50 border border-red-100 p-3 rounded-lg flex flex-col gap-2">
               <p className="text-[12.5px] font-bold flex items-start text-slate-800 leading-tight">
                 <span className="text-red-500 mr-2 text-sm leading-none mt-px">⚠️</span>
                 {dynamicContent.warning}
               </p>
               <p className="text-[11px] font-bold flex items-start text-green-700 ml-0.5">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mt-0.5 mr-2 shrink-0"></span>
                 {dynamicContent.sub}
               </p>
               <p className="text-[9.5px] uppercase tracking-[0.15em] font-black text-slate-400 mt-0.5 ml-0.5">
                 Limited same-day availability
               </p>
            </div>
          </div>
        </div>

        {/* 2-Col Grid for Contact Profile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Name input */}
          <div className="relative group">
            <label htmlFor="name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-0.5">Full Name</label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400 group-focus-within:text-hvac-navy transition-colors">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-hvac-navy focus:border-hvac-navy focus:bg-white transition-all duration-300 font-medium placeholder-slate-400 shadow-sm"
                placeholder="e.g. John Doe"
              />
            </div>
          </div>

          {/* Phone input */}
          <div className="relative group">
            <label htmlFor="phone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-0.5">Phone Number</label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400 group-focus-within:text-hvac-navy transition-colors">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-hvac-navy focus:border-hvac-navy focus:bg-white transition-all duration-300 font-medium placeholder-slate-400 shadow-sm"
                placeholder="(555) 000-0000"
              />
            </div>
            <div className="mt-2 ml-0.5 flex flex-col gap-1.5">
              <p className="text-[10.5px] font-bold text-slate-600 flex items-center gap-1.5 leading-tight">
                <svg className="w-3.5 h-3.5 text-hvac-navy shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                We’ll text you immediately with available technicians
              </p>
              <p className="text-[9.5px] uppercase tracking-wider text-slate-400 font-black ml-5">
                 No spam. Just your request.
              </p>
            </div>
          </div>
        </div>

        {/* Location Hybrid Input */}
        <div className="relative group bg-slate-50 border border-slate-100 p-4 rounded-xl shadow-sm">
          <label htmlFor="location" className="block text-[13.5px] font-bold text-slate-800 tracking-wide mb-2.5 ml-0.5 flex justify-between items-center">
            Service Address or ZIP Code
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-slate-400 group-focus-within:text-hvac-navy transition-colors">
               <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <input
              id="location"
              name="location"
              type="text"
              required
              className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-hvac-navy focus:border-hvac-navy transition-all duration-300 font-bold placeholder-slate-400 shadow-sm"
              placeholder="City, State or ZIP (e.g., Tampa, FL or 33602)"
            />
          </div>
          <button 
            type="button"
            onClick={() => {
              if (navigator.geolocation) {
                const input = document.getElementById("location") as HTMLInputElement;
                if(input) { input.placeholder = "Locating..."; input.value = ""; }
                navigator.geolocation.getCurrentPosition(
                  async (pos) => {
                    try {
                      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`);
                      const data = await res.json();
                      if(input) {
                        input.value = `${data.city || data.locality}, ${data.principalSubdivision}`;
                      }
                    } catch(e) {
                      if(input) input.value = `${pos.coords.latitude}, ${pos.coords.longitude}`;
                    }
                  },
                  () => {
                    if(input) input.placeholder = "City, State or ZIP (e.g., Tampa, FL or 33602)";
                    alert("Location access denied. Please enter manually.");
                  }
                );
              }
            }}
            className="text-[12px] font-bold text-hvac-navy bg-hvac-navy/5 hover:bg-hvac-navy/10 px-3 py-1.5 rounded-lg border border-hvac-navy/10 transition-colors mt-3 mb-1 flex items-center gap-1.5 w-max"
          >
            📍 Use my current location
          </button>
          
          <p className="text-[11.5px] text-slate-500 mt-2 flex items-center gap-1.5 font-medium ml-1">
             <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
             We’ll match you with nearby technicians.
          </p>
        </div>

        {/* Service Urgency Radio Row */}
        <div className="mt-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="pb-2 border-b border-slate-200 mb-3">
             <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
               <svg className="w-3.5 h-3.5 text-hvac-gold" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
               When do you need service?
             </h3>
          </div>
          
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-300 bg-white cursor-pointer hover:border-hvac-navy/50 transition-colors shadow-sm">
              <input type="radio" name="timing" value="asap" defaultChecked className="w-4 h-4 text-hvac-navy focus:ring-hvac-navy border-slate-300" />
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                ASAP 
                <span className="text-[10px] uppercase font-black bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200">Recommended</span>
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white cursor-pointer hover:border-hvac-navy/50 transition-colors shadow-sm">
                <input type="radio" name="timing" value="today" className="w-4 h-4 text-hvac-navy focus:ring-hvac-navy border-slate-300" />
                <span className="text-sm font-semibold text-slate-700">Today</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white cursor-pointer hover:border-hvac-navy/50 transition-colors shadow-sm">
                <input type="radio" name="timing" value="this-week" className="w-4 h-4 text-hvac-navy focus:ring-hvac-navy border-slate-300" />
                <span className="text-sm font-semibold text-slate-700">This week</span>
              </label>
            </div>
          </div>
        </div>

        {/* Required SMS Consent Checkbox */}
        <div className="pt-1 mt-3">
          <label className="flex items-start gap-3 cursor-pointer group bg-slate-50/50 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="relative flex items-center justify-center mt-0.5 shrink-0">
              <input type="checkbox" name="sms_consent" required className="w-5 h-5 rounded border-slate-300 text-hvac-navy focus:ring-hvac-navy shadow-sm cursor-pointer transition-all" />
            </div>
            <p className="text-[12.5px] text-slate-600 leading-relaxed font-medium group-hover:text-slate-800 transition-colors">
              By submitting, you agree to receive SMS messages related to your request.<br className="hidden sm:inline" /> Message frequency varies based on your request. Message & data rates may apply. Reply STOP to opt out.
            </p>
          </label>
        </div>

        {/* Pre-Submit Hook */}
        <div className="text-center pt-2">
           <p className="text-[11.5px] font-bold text-slate-400 mb-2.5 uppercase tracking-widest flex items-center justify-center gap-2">
             <span className="w-8 h-px bg-slate-200"></span>
             Takes 30 seconds <span className="text-slate-300">•</span> No obligation
             <span className="w-8 h-px bg-slate-200"></span>
           </p>
        </div>

        {/* Action Button */}
        <div className="pt-0">
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-hvac-gold hover:bg-yellow-400 text-hvac-navy font-black text-[17px] py-4.5 rounded-xl transition-all duration-300 shadow-[0_4px_14px_rgba(252,211,77,0.5)] hover:shadow-[0_8px_20px_rgba(252,211,77,0.7)] disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none border border-yellow-500/50"
          >
            {status === "loading" ? (
              <span className="flex items-center gap-2.5 py-1">
                <svg className="animate-spin h-5 w-5 text-hvac-navy" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Request...
              </span>
            ) : (
              <span className="flex items-center gap-2 py-1">
                {dynamicContent.cta}
                <svg className="w-5 h-5 opacity-90 relative top-px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </span>
            )}
          </button>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-5 mb-5 text-[11.5px] font-bold text-slate-500">
            <span className="flex items-center gap-1.5"><span className="text-yellow-400 text-sm">⭐</span> Local verified technicians</span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="flex items-center gap-1.5"><span className="text-hvac-navy text-sm">🔧</span> Licensed & insured</span>
          </div>
          
          <div className="pt-4 border-t border-slate-100/80 text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline decoration-slate-200 underline-offset-2 transition-colors">Privacy Policy</a>
              <span className="mx-2.5 opacity-40">|</span>
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline decoration-slate-200 underline-offset-2 transition-colors">Terms & Conditions</a>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
