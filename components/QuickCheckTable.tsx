import React from 'react';

export default function QuickCheckTable({ causes }: { causes?: any[] }) {
  if (!causes || causes.length === 0) return null;

  return (
    <div className="border rounded-xl p-4 mb-6 bg-white dark:bg-slate-900 dark:border-slate-800">
      <h3 className="font-semibold mb-3 text-slate-900 dark:text-white">Quick System Check</h3>

      <table className="w-full text-sm">
        <tbody>
          {causes.slice(0, 4).map((c: any, i: number) => (
            <tr key={i} className={`${i !== Math.min(causes.length, 4) - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}>
              <td className="py-2 text-slate-700 dark:text-slate-300 font-medium">{c.name}</td>
              <td className="py-2 text-right">
                <span className="text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">
                  Yes / No
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
