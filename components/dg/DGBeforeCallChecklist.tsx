export type DGBeforeCallSections = "both" | "before-only" | "do-not-only";

export function DGBeforeCallChecklist({
  beforeYouCall,
  doNotAttempt,
  sections = "both",
}: {
  beforeYouCall: string[];
  doNotAttempt: string[];
  /** `before-only` / `do-not-only` split the block for placement (e.g. before you call under Quick Checks). */
  sections?: DGBeforeCallSections;
}) {
  const showBefore =
    beforeYouCall.length > 0 && (sections === "both" || sections === "before-only");
  const showDoNot =
    doNotAttempt.length > 0 && (sections === "both" || sections === "do-not-only");

  if (!showBefore && !showDoNot) return null;

  return (
    <section
      className={[
        "dg-before-call",
        sections === "before-only" ? "dg-before-call--after-quick" : "",
        sections === "do-not-only" ? "dg-before-call--footer" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showBefore ? (
        <>
          <h2 className="dg-before-call__title">Before you call</h2>
          <ul className="dg-before-call__list dg-before-call__list--bulleted">
            {beforeYouCall.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </>
      ) : null}
      {showDoNot ? (
        <>
          <h2 className="dg-before-call__title dg-before-call__title--risk">Do not attempt</h2>
          <ul className="dg-before-call__list dg-before-call__list--risk">
            {doNotAttempt.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
