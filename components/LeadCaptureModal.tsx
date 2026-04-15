"use client";

import { useEffect, useState } from "react";

export default function LeadCaptureModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorPrompt, setErrorPrompt] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    service: "",
    systemType: "",
    urgency: "",
    preferredContactTime: "",
    smsOptIn: false,
  });

  // Global event listeners to open the modal from ANY button on the page
  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(true);

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // If the clicked element or any of its parents have the data attribute
      if (target.closest('[data-open-lead-modal]')) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("open-lead-modal", handleOpenEvent);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("open-lead-modal", handleOpenEvent);
    };
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      // Reset form state slightly after close
      if (isSuccess) {
        setTimeout(() => setIsSuccess(false), 500);
      }
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorPrompt("");

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to submit");
      
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      setErrorPrompt("There was an issue submitting your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const t = e.target;
    if (t instanceof HTMLInputElement && t.type === "checkbox") {
      setFormData((prev) => ({ ...prev, [t.name]: t.checked }));
      return;
    }
    setFormData((prev) => ({ ...prev, [t.name]: t.value }));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-slate-900 w-[90%] sm:w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border-2 border-hvac-gold/20">
        
        {/* Close Button */}
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isSuccess ? (
          <div className="p-12 text-center flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Request Received</h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
              Thank you. A local HVAC technician will contact you shortly to confirm your diagnostic assessment.
            </p>
            <button 
              onClick={() => setIsOpen(false)}
              className="mt-8 px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded-xl transition-colors"
            >
              Close Window
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-8 pb-6 bg-hvac-navy text-center border-b border-hvac-blue/20">
              <h2 id="modal-title" className="text-white text-2xl sm:text-3xl font-black tracking-tight m-0 border-0">
                Get Local HVAC Repair Help
              </h2>
              <p className="text-slate-300 text-sm mt-3 leading-relaxed opacity-90">
                Local licensed HVAC technicians respond quickly to emergency diagnostic requests.
              </p>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950">
              {/* Trust Signals */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-8">
                <ul className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✔</span> Local licensed HVAC technicians
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✔</span> Fast response times
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✔</span> No obligation quotes
                  </li>
                </ul>
              </div>

              {errorPrompt && (
                <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg mb-6 border border-red-100 text-center">
                  {errorPrompt}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">First Name</label>
                    <input required name="firstName" value={formData.firstName} onChange={handleChange} type="text" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-hvac-blue transition-shadow text-slate-900 dark:text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Last Name</label>
                    <input required name="lastName" value={formData.lastName} onChange={handleChange} type="text" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-hvac-blue transition-shadow text-slate-900 dark:text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                    <input required name="phone" value={formData.phone} onChange={handleChange} type="tel" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-hvac-blue transition-shadow text-slate-900 dark:text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                    <input required name="email" value={formData.email} onChange={handleChange} type="email" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-hvac-blue transition-shadow text-slate-900 dark:text-white" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Street Address</label>
                  <input name="address" value={formData.address} onChange={handleChange} type="text" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-hvac-blue transition-shadow text-slate-900 dark:text-white" />
                </div>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 sm:col-span-6 space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">City</label>
                    <input required name="city" value={formData.city} onChange={handleChange} type="text" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-hvac-blue transition-shadow text-slate-900 dark:text-white" />
                  </div>
                  <div className="col-span-5 sm:col-span-3 space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">State</label>
                    <input required name="state" value={formData.state} onChange={handleChange} type="text" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-hvac-blue transition-shadow text-slate-900 dark:text-white" />
                  </div>
                  <div className="col-span-7 sm:col-span-3 space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">ZIP</label>
                    <input required name="zip" value={formData.zip} onChange={handleChange} type="text" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-hvac-blue transition-shadow text-slate-900 dark:text-white" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">System Type</label>
                  <select name="systemType" value={formData.systemType} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-hvac-blue text-slate-900 dark:text-white">
                    <option value="">Select...</option>
                    <option value="residential-ac">Residential AC</option>
                    <option value="rv-ac">RV AC</option>
                    <option value="mini-split">Mini Split</option>
                    <option value="rooftop-hvac">Rooftop HVAC</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Describe Your Problem</label>
                  <textarea required name="service" value={formData.service} onChange={handleChange} rows={3} placeholder="E.g., AC blowing warm air, thermostat screen blank..." className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-hvac-blue transition-shadow text-slate-900 dark:text-white resize-none"></textarea>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3">
                  <input
                    id="smsOptIn"
                    name="smsOptIn"
                    type="checkbox"
                    checked={formData.smsOptIn}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-hvac-blue focus:ring-hvac-blue"
                  />
                  <label htmlFor="smsOptIn" className="text-sm text-slate-600 dark:text-slate-300 leading-snug cursor-pointer">
                    <span className="font-bold text-slate-800 dark:text-white">SMS updates</span> — I agree to receive
                    text messages about my request at the number above (rates may apply). You can wire Twilio for
                    confirmations when ready.
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Urgency</label>
                    <select name="urgency" value={formData.urgency} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-hvac-blue text-slate-900 dark:text-white">
                      <option value="">Select...</option>
                      <option value="emergency">Emergency</option>
                      <option value="soon">Within a few days</option>
                      <option value="routine">Routine</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Preferred Contact Time</label>
                    <select name="preferredContactTime" value={formData.preferredContactTime} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-hvac-blue text-slate-900 dark:text-white">
                      <option value="">Select...</option>
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                      <option value="any">Any time</option>
                    </select>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  HVAC Revenue Boost connects users with independent service professionals and does not perform repairs.
                </p>

                {/* Submit Sticky Footer-ish within scroll area */}
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-hvac-gold hover:bg-yellow-500 text-hvac-navy font-black text-lg py-4 rounded-xl uppercase tracking-widest transition-colors shadow-lg shadow-hvac-gold/20 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-hvac-navy/30 border-t-hvac-navy rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : "Get HVAC Repair Quotes"}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
