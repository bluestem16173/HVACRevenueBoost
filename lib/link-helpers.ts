/**
 * Linking helpers — Context → Symptom → Cause → Repair
 * Keeps links relevant, 3–6 per page, natural anchor text.
 */

/** Consistent slug format for URLs */
export function slugify(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Render anchor with standard styling */
export function link(slug: string, text: string, basePath = ''): string {
  const href = basePath ? `/${basePath}/${slug}` : `/${slug}`;
  return `<a href="${href}" class="text-hvac-blue hover:underline font-medium">${escapeHtml(text)}</a>`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
