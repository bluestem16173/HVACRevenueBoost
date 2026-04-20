export type HomeServiceTrade = "hvac" | "plumbing" | "electrical";

/** First path segment after `/` → trade for lead UI and CTA copy. */
export function inferHomeServiceTradeFromPathname(pathname: string | null | undefined): HomeServiceTrade {
  const p = (pathname ?? "").split("?")[0] ?? "";
  const seg = p.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
  if (seg === "plumbing") return "plumbing";
  if (seg === "electrical") return "electrical";
  return "hvac";
}
