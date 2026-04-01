import React from 'react';

export default function ThresholdBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-black text-white dark:bg-white dark:text-black font-bold px-2 py-0.5 rounded text-xs ml-1 inline-block shadow-sm">
      {children}
    </span>
  );
}
