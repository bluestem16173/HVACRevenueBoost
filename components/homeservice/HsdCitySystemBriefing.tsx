import type { HowSystemStartsBlock } from "@/lib/homeservice/parseHowSystemStarts";

type Props = { block: HowSystemStartsBlock };

/**
 * DecisionGrid-style technical briefing: tight copy, numbered startup sequence,
 * local context, symptom→failure mapping. No tinted “card” panels — divider + typography only.
 */
export function HsdCitySystemBriefing({ block }: Props) {
  const startupSequence = Array.isArray(block.startup_sequence) ? block.startup_sequence : [];
  const environmentBullets = Array.isArray(block.environment_bullets) ? block.environment_bullets : [];
  const mappingRows = Array.isArray(block.mapping_rows) ? block.mapping_rows : [];

  return (
    <section
      className="mb-10 border-t border-slate-200 pt-10 dark:border-slate-700"
      aria-labelledby="hsd-system-briefing-title"
    >
      {block.eyebrow ? (
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {block.eyebrow}
        </p>
      ) : null}
      <h2
        id="hsd-system-briefing-title"
        className="mt-1 text-2xl font-black tracking-tight text-hvac-navy dark:text-white sm:text-[1.65rem]"
      >
        {block.section_title ?? ""}
      </h2>

      <p className="mt-4 border-l-2 border-hvac-gold pl-4 text-sm font-semibold leading-snug text-slate-800 dark:border-hvac-gold dark:text-slate-200 sm:text-[15px]">
        {block.authority_line ?? ""}
      </p>

      <p className="mt-5 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        Startup sequence
      </p>
      <ol className="mt-3 space-y-4">
        {startupSequence.map((step, i) => (
          <li key={i} className="flex gap-4">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-black text-hvac-navy dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              aria-hidden
            >
              {i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-black text-slate-900 dark:text-white sm:text-base">{step.title ?? ""}</p>
              <p className="mt-1 text-sm leading-snug text-slate-600 dark:text-slate-400">{step.detail ?? ""}</p>
            </div>
          </li>
        ))}
      </ol>

      <h3 className="mt-10 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
        {block.environment_title ?? ""}
      </h3>
      <ul className="mt-2 space-y-1.5 text-sm leading-snug text-slate-700 dark:text-slate-300 sm:text-[15px]">
        {environmentBullets.map((line, i) => (
          <li key={i} className="flex gap-2">
            <span className="shrink-0 font-bold text-slate-400 dark:text-slate-500" aria-hidden>
              ·
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <h3 className="mt-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
        {block.mapping_title ?? ""}
      </h3>
      <ul className="mt-2 divide-y divide-slate-200 border border-slate-200 dark:divide-slate-600 dark:border-slate-600">
        {mappingRows.map((row, i) => (
          <li
            key={i}
            className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
          >
            <span className="text-sm font-bold text-slate-900 dark:text-white">{row.cue ?? ""}</span>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 sm:text-right">
              → {row.points_to ?? ""}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
