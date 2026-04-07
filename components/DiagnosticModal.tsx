"use client";

import { useEffect, useState } from "react";
import LeadCard from "./LeadCard";

export default function DiagnosticModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Map globally for older CTAs and static DB content
    (window as any).openLeadCard = () => {
      window.dispatchEvent(new CustomEvent("open-leadcard"));
    };

    const handler = () => setIsOpen(true);
    window.addEventListener("open-leadcard", handler);
    return () => window.removeEventListener("open-leadcard", handler);
  }, []);

  useEffect(() => {
    let shown = false;

    const open = () => {
      if (shown) return;
      shown = true;
      window.dispatchEvent(new CustomEvent("open-leadcard"));
    };

    const timer = setTimeout(open, 8000);

    const scrollHandler = () => {
      if (window.scrollY > 600) open();
    };

    window.addEventListener("scroll", scrollHandler);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", scrollHandler);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      {/* 
        1. max-w-[420px] to constrain width 
        2. scale-90 so it physically looks smaller and doesn't dominate the whole screen
        3. relative positioning so the close button anchors correctly
      */}
      <div className="relative w-full max-w-[420px] scale-90 sm:scale-95 animate-in fade-in zoom-in duration-200">
        
        {/* Prominent floating close button over the top right corner */}
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute z-[10000] -top-5 -right-5 w-12 h-12 bg-white text-slate-900 rounded-full shadow-xl border-4 border-slate-900 flex items-center justify-center hover:bg-slate-100 hover:text-red-600 text-3xl font-black transition-transform hover:scale-110"
          aria-label="Close Modal"
        >
          &times;
        </button>

        {/* Constrain height and allow scrolling if the screen is super short */}
        <div className="max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl">
          <LeadCard serviceType="ac" />
        </div>
      </div>
    </div>
  );
}
