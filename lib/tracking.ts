/**
 * Revenue Layer — Event Tracking
 * ------------------------------
 * Non-breaking tracking for CTA clicks, repair/diagnose engagement, affiliate intent.
 * Events sent to /api/track for later DB/analytics pipeline.
 */

export function trackEvent(event: string, data?: Record<string, unknown>) {
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        data: data ?? {},
        ts: Date.now(),
      }),
    }).catch(() => {});
  } catch {
    // Silent fail — tracking must not break UX
  }
}
