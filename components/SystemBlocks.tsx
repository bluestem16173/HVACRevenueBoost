import { SYSTEM_BLOCKS, type SystemBlockKey } from "@/lib/systemBlocks";

type Props = {
  keys: readonly SystemBlockKey[];
};

/**
 * DecisionGrid-style system knowledge layer — border + typography only (no tinted panels).
 * Placement: immediately under quick decision tree, before quick checks / clusters.
 */
export function SystemBlocks({ keys }: Props) {
  if (!keys.length) return null;

  return (
    <section
      id="section-system-blocks"
      className="mb-10 scroll-mt-28 border-t border-slate-200 pt-10 dark:border-slate-700"
      aria-label="How the system works"
    >
      {keys.map((key) => {
        const block = SYSTEM_BLOCKS[key];
        if (!block) return null;
        return (
          <article key={key} className="mb-10 last:mb-0">
            <h2 className="text-xl font-black tracking-tight text-hvac-navy dark:text-white sm:text-[1.35rem]">
              {block.title}
            </h2>
            <div
              className="mt-4 max-w-none text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:text-[15px] [&_li]:my-1.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-[0.65rem] [&_p:first-child]:mt-0 [&_strong]:font-black [&_strong]:text-hvac-navy dark:[&_strong]:text-hvac-gold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: block.content.trim() }}
            />
          </article>
        );
      })}
    </section>
  );
}
