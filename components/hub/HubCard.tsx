import Link from "next/link";
import { ReactNode } from "react";

export function HubCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description?: string;
  href: string;
  icon?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:border-hvac-blue hover:-translate-y-1 relative overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-hvac-blue to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="flex items-start gap-4 h-full flex-col">
        {icon && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-hvac-blue shrink-0 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        )}
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 leading-snug group-hover:text-hvac-blue transition-colors">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
              {description}
            </p>
          )}
        </div>
        
        <div className="mt-auto pt-4 flex items-center text-sm font-bold text-hvac-blue tracking-wide uppercase">
          Explore Guides
          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
