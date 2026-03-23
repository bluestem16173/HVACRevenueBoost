import { ReactNode } from "react";

export function HubSection({
  title,
  subtitle,
  children,
  id,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={`py-16 md:py-24 border-t border-slate-200 dark:border-slate-800 ${className}`}>
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="max-w-3xl mb-12">
          <h2 className="text-3xl md:text-5xl font-black text-hvac-navy dark:text-white leading-tight mb-4 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              {subtitle}
            </p>
          )}
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}
