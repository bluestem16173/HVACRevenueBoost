export type DgAuthorityCtaPayload = {
  title: string;
  body: string;
  button: string;
  /** Optional link; omit for non-navigating prototype button. */
  href?: string;
};

export function asCtaPayload(v: unknown): DgAuthorityCtaPayload | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title.trim() : "";
  const body = typeof o.body === "string" ? o.body.trim() : "";
  const button = typeof o.button === "string" ? o.button.trim() : "";
  if (!title || !body || !button) return null;
  const href = typeof o.href === "string" && o.href.trim() ? o.href.trim() : undefined;
  return { title, body, button, href };
}
