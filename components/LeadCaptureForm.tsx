"use client";

import { useState } from "react";

export default function LeadCaptureForm({ city, symptomId }: { city?: string, symptomId?: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [step, setStep] = useState(1);
  const [zip, setZip] = useState("");

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (zip.length >= 5) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    const data = {
      ...Object.fromEntries(formData.entries()),
      zip, // Include value from state
      city: city || null,
      symptomId: symptomId || null,
      source: "DecisionGrid-HVAC-V2-Engine"
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error("Lead submission error:", err);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-green-50 border border-green-200 p-8 rounded-2xl text-center shadow-lg transform transition-all animate-in fade-in zoom-in">
        <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg">✓</div>
        <h3 className="text-green-800 border-0 p-0 mb-2 font-black text-xl">Service Confirmed!</h3>
        <p className="text-green-700 m-0 leading-relaxed font-medium">Your diagnostic report has been shared with a local {city || ""} specialist. Expect a call within 15-30 minutes.</p>
      </div>
    );
  }

  return (
    <div className="manual-card bg-hvac-navy text-white overflow-hidden relative border-0 shadow-2xl rounded-2xl">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
        <div className={`h-full bg-hvac-gold transition-all duration-500 ease-out ${step === 1 ? 'w-1/2' : 'w-full'}`}></div>
      </div>

      <div className="p-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-hvac-gold text-hvac-navy flex items-center justify-center text-[10px] font-black">{step}</div>
          <span className="text-[10px] uppercase font-black tracking-[0.2em] text-hvac-gold">Step {step} of 2</span>
        </div>

        {step === 1 ? (
          <form onSubmit={handleNext} className="space-y-6">
            <h2 className="text-white mt-0 mb-4 text-2xl font-black leading-tight">Check Local Service Availability</h2>
            <p className="text-slate-400 text-sm mt-0 leading-relaxed font-normal">
              Enter your ZIP code to verify technician availability for **{city || "your area"}**.
            </p>
            
            <div className="relative">
              <input 
                type="text" 
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="Enter ZIP Code" 
                required 
                className="w-full p-4 rounded-xl bg-slate-800 border-2 border-slate-700 text-white focus:border-hvac-gold focus:ring-4 focus:ring-hvac-gold/20 outline-none text-lg font-bold"
              />
              {zip.length >= 5 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400 text-xs font-bold flex items-center gap-1 bg-green-400/10 px-2 py-1 rounded">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Valid
                </div>
              )}
            </div>
            
            <button 
              type="submit"
              disabled={zip.length < 5}
              className="btn-primary w-full bg-hvac-gold text-hvac-navy hover:bg-yellow-500 font-black text-lg py-5 shadow-2xl shadow-hvac-gold/20 disabled:opacity-50 disabled:grayscale transition-all"
            >
              VERIFY AVAILABILITY →
            </button>
            
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-800">
              <div className="text-center">
                <div className="text-hvac-gold text-xs font-bold leading-none">24/7</div>
                <div className="text-[8px] text-slate-500 uppercase mt-1">Open</div>
              </div>
              <div className="w-px h-4 bg-slate-800"></div>
              <div className="text-center">
                <div className="text-hvac-gold text-xs font-bold leading-none">15 MIN</div>
                <div className="text-[8px] text-slate-500 uppercase mt-1">Response</div>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-right duration-300">
            <div className="bg-green-400/10 border border-green-400/20 p-3 rounded-xl mb-4 flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
              <div className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Technician Found in {zip}!</div>
            </div>

            <h2 className="text-white mt-0 mb-4 text-2xl font-black leading-tight">Claim Priority Dispatch</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" 
                name="name" 
                placeholder="First & Last Name" 
                required 
                className="w-full p-4 rounded-xl bg-slate-800 border-2 border-slate-700 text-white focus:border-hvac-gold outline-none"
              />
              <input 
                type="tel" 
                name="phone" 
                placeholder="Phone Number" 
                required 
                className="w-full p-4 rounded-xl bg-slate-800 border-2 border-slate-700 text-white focus:border-hvac-gold outline-none"
              />
            </div>
            
            <input 
              type="email" 
              name="email" 
              placeholder="Primary Email Address" 
              required 
              className="w-full p-4 rounded-xl bg-slate-800 border-2 border-slate-700 text-white focus:border-hvac-gold outline-none"
            />

            <select 
              name="urgency" 
              className="w-full p-4 rounded-xl bg-slate-800 border-2 border-slate-700 text-white focus:border-hvac-gold outline-none appearance-none cursor-pointer"
            >
              <option value="today">Immediate (Emergency)</option>
              <option value="asap">ASAP (Next 24h)</option>
              <option value="estimate">Get Free Estimate</option>
            </select>
            
            <button 
              type="submit" 
              disabled={status === "loading"}
              className="btn-primary w-full bg-hvac-gold text-hvac-navy hover:bg-yellow-500 font-black text-lg py-5 mt-4"
            >
              {status === "loading" ? "SENDING..." : "CONFIRM DISPATCH"}
            </button>
            <button 
              type="button" 
              onClick={() => setStep(1)}
              className="w-full text-[10px] text-slate-500 uppercase tracking-widest mt-2 hover:text-white transition-colors"
            >
              ← Back to ZIP Search
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
