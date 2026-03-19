/**
 * Text Formatting — Render Layer
 * ------------------------------
 * AI → intelligence. Frontend → presentation.
 * Always handle in frontend: title casing, bullet formatting, spacing.
 * Never rely on AI for formatting.
 */

/** Strip junk spacing (multiple spaces, tabs) */
export function cleanSpacing(text: string): string {
  if (!text || typeof text !== "string") return "";
  return text.replace(/\s{2,}/g, " ").trim();
}

/** Escape HTML for safe output */
export function esc(s: string): string {
  if (!s || typeof s !== "string") return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Format text: newlines → br, **bold** → <strong>. Call AFTER esc for safe HTML. */
export function formatText(text: string): string {
  if (!text || typeof text !== "string") return "";
  let out = String(text)
    .replace(/\\n/g, "\n")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  out = cleanSpacing(out);
  return out.replace(/\n/g, "<br/>");
}

/** Safe format: esc first, then format (for HTML output) */
export function formatTextSafe(text: string): string {
  return formatText(esc(text));
}

/** Detect bullet lines and convert to <ul><li> */
export function formatBullets(text: string): string {
  if (!text || typeof text !== "string") return "";
  const lines = text.split(/\n|\\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.some((l) => l.startsWith("-") || l.startsWith("•"))) {
    const items = lines
      .map((l) => l.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean)
      .map((l) => `<li>${formatTextSafe(l)}</li>`)
      .join("");
    return items ? `<ul class="list-disc pl-5 space-y-1">${items}</ul>` : formatTextSafe(text);
  }
  return formatTextSafe(text);
}

/** Title case: capitalize first letter of each word */
export function titleCase(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  );
}

/** Simple title format: capitalize first char */
export function formatTitle(title: string): string {
  if (!title || typeof title !== "string") return "";
  const t = cleanSpacing(title);
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Force 4 slots for components/tools — affiliate-ready, consistent layout. Always render 4 slots, same UI everywhere. */
export function normalizeItems(items: unknown[] = []) {
  const filled = [...items];

  while (filled.length < 4) {
    filled.push({
      name: "Coming Soon",
      description: "Recommended tools and components will be added here.",
      affiliate_url: null,
      image_url: null,
    });
  }

  return filled.slice(0, 4);
}

/** Normalize components to 4 slots — "Recommended Component" placeholder for empty. */
export function normalizeComponents(items: unknown[] = []) {
  const filled = [...items];

  while (filled.length < 4) {
    filled.push({
      name: "Recommended Component",
      description: "Compatible replacement parts and upgrades available.",
      affiliate_url: null,
      image_url: null,
    });
  }

  return filled.slice(0, 4);
}

/** Normalize tools to 4 slots — "Recommended Tool" placeholder for empty. */
export function normalizeTools(items: unknown[] = []) {
  const filled = [...items];

  while (filled.length < 4) {
    filled.push({
      name: "Recommended Tool",
      description: "Essential tools for HVAC diagnostics and repair.",
      affiliate_url: null,
      image_url: null,
    });
  }

  return filled.slice(0, 4);
}
