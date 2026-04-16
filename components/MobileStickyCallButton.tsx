"use client";

import { PhoneCall } from "lucide-react";
import { useEffect, useState } from "react";

export default function MobileStickyCallButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show the strip after scrolling down a bit so it doesn't crowd the top
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="fixed left-0 right-0 z-50 md:hidden animate-in slide-in-from-bottom-full duration-300"
      style={{ bottom: "var(--hvacrb-sticky-call-offset, 0px)" }}
    >
      <a 
        href="tel:1-800-555-0199" // TODO: Replace with dynamic/GHL tracking number
        className="flex items-center justify-center gap-3 bg-hvac-navy text-white font-black w-full py-4 text-center text-lg shadow-[0_-5px_15px_rgba(0,0,0,0.1)] active:bg-blue-900 transition-colors"
      >
        <PhoneCall size={20} className="animate-pulse" />
        Call HVAC Technician Now
      </a>
      {/* Safe area padding for newer iPhones */}
      <div className="bg-hvac-navy h-safe-area-bottom"></div>
    </div>
  );
}
