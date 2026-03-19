/**
 * Image fallbacks — consistent placeholder for diagnose/condition pages.
 * Handles: generator not saving image URLs, different JSON field names, conditional blocks.
 */

export const HVAC_PLACEHOLDER_IMAGE = "/images/hvac-default.svg";
/** @deprecated Use HVAC_PLACEHOLDER_IMAGE */
export const PLACEHOLDER_IMAGE = HVAC_PLACEHOLDER_IMAGE;
export const HVAC_PLACEHOLDER_ALT = "HVAC illustration";

/** Resolve image URL from item that may use image_url, imageURL, image, or img_url. */
export function getImageSrc(
  item: Record<string, unknown> | null | undefined
): string {
  if (!item) return HVAC_PLACEHOLDER_IMAGE;
  const v =
    (item.image_url as string) ??
    (item.imageURL as string) ??
    (item.image as string) ??
    (item.img_url as string) ??
    "";
  return typeof v === "string" && v.trim() ? v.trim() : HVAC_PLACEHOLDER_IMAGE;
}

/** Resolve alt text with fallback. */
export function getImageAlt(alt: string | null | undefined, fallback = HVAC_PLACEHOLDER_ALT): string {
  return (typeof alt === "string" && alt.trim()) ? alt.trim() : fallback;
}
