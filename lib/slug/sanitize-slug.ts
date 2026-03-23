export function sanitizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/^diagnose\//, "")
    .replace(/^causes\//, "")
    .replace(/^repairs\//, "")
    .replace(/^systems\//, "")
    .replace(/^symptoms\//, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}
