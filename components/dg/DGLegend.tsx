/**
 * Visual key for dual-layer content: Pro / Homeowner / Risk (# markers match `.dg-pro` / `.dg-home` / `.dg-risk`).
 */
export function DGLegend() {
  return (
    <div className="dg-legend-block">
      <p className="dg-legend-label">How to read this page:</p>
      <div className="dg-legend" role="group" aria-label="How to read technical layers on this page">
        <span className="dg-legend-item pro">
          <span className="hash" aria-hidden="true">
            #
          </span>
          Pro (Technical Signal)
        </span>
        <span className="dg-legend-item home">
          <span className="hash" aria-hidden="true">
            #
          </span>
          Homeowner (What this means)
        </span>
        <span className="dg-legend-item risk">
          <span className="hash" aria-hidden="true">
            #
          </span>
          Risk (Where people get this wrong)
        </span>
      </div>
    </div>
  );
}
