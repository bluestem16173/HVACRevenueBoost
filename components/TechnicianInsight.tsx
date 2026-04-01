import React from 'react';

export default function TechnicianInsight({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 rounded-md mb-6">
      <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-300">🛠 Technician Insight</h4>
      <p className="text-sm font-medium text-blue-800 dark:text-blue-400">{children}</p>
    </div>
  );
}
