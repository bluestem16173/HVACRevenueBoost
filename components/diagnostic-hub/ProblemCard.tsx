import Link from "next/link";

export type ProblemCardProps = {
  title: string;
  href: string;
};

export function ProblemCard({ title, href }: ProblemCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-semibold text-hvac-navy shadow-sm transition hover:border-hvac-blue hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-hvac-blue dark:hover:bg-slate-800/80"
    >
      {title}
    </Link>
  );
}
