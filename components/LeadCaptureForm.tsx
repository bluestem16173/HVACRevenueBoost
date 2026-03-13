"use client";

import { useState } from "react";

export default function LeadCaptureForm({ city, symptomId }: { city?: string, symptomId?: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    const data = {
      ...Object.fromEntries(formData.entries()),
      city: city || null,
      symptomId: symptomId || null
    };

    try {
      // GoHighLevel Webhook Simulation
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
      <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
        <h3 className="text-green-800 border-0 p-0 mb-2">Request Received!</h3>
        <p className="text-green-700 m-0">An HVAC technician will contact you shortly to assist with your diagnostic results.</p>
      </div>
    );
  }

  return (
    <div className="manual-card bg-hvac-navy text-white">
      <h2 className="text-white mt-0 mb-2">Professional Repair Help</h2>
      <p className="text-slate-300 text-sm mt-0 mb-6 font-normal">
        Don&apos;t risk further damage. Connect with a licensed HVAC technician to verify your findings.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <input 
            type="text" 
            name="name" 
            placeholder="Full Name" 
            required 
            className="w-full p-3 rounded bg-slate-800 border-slate-700 text-white focus:ring-2 focus:ring-hvac-gold outline-none"
          />
          <input 
            type="tel" 
            name="phone" 
            placeholder="Phone Number" 
            required 
            className="w-full p-3 rounded bg-slate-800 border-slate-700 text-white focus:ring-2 focus:ring-hvac-gold outline-none"
          />
        </div>
        <input 
          type="email" 
          name="email" 
          placeholder="Email Address" 
          required 
          className="w-full p-3 rounded bg-slate-800 border-slate-700 text-white focus:ring-2 focus:ring-hvac-gold outline-none"
        />
        <div className="grid md:grid-cols-2 gap-4">
          <input 
            type="text" 
            name="zip" 
            placeholder="ZIP Code" 
            required 
            className="w-full p-3 rounded bg-slate-800 border-slate-700 text-white focus:ring-2 focus:ring-hvac-gold outline-none"
          />
          <select 
            name="urgency" 
            className="w-full p-3 rounded bg-slate-800 border-slate-700 text-white focus:ring-2 focus:ring-hvac-gold outline-none"
          >
            <option value="today">Urgent (Today)</option>
            <option value="asap">ASAP (1-2 days)</option>
            <option value="estimate">Free Estimate</option>
          </select>
        </div>
        <textarea 
          name="problem" 
          placeholder="Describe your HVAC issue..." 
          rows={3} 
          className="w-full p-3 rounded bg-slate-800 border-slate-700 text-white focus:ring-2 focus:ring-hvac-gold outline-none"
        ></textarea>
        
        <button 
          type="submit" 
          disabled={status === "loading"}
          className="btn-primary w-full bg-hvac-gold text-hvac-navy hover:bg-yellow-500 font-black text-lg py-4"
        >
          {status === "loading" ? "Processing..." : "BOOK HVAC DIAGNOSTIC"}
        </button>
        <p className="text-[10px] text-slate-500 text-center m-0">
          By clicking, you agree to be contacted by an HVAC professional in your area.
        </p>
      </form>
    </div>
  );
}
