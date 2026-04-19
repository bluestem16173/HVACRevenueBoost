/**
 * Canonical URLs for SEO (App Router).
 *
 * The Pages Router pattern (`next/head` + `<link rel="canonical">`) does not apply under `app/`.
 * Use {@link canonicalMetadata} / {@link siteCanonicalUrl} from this module in each route’s
 * `export const metadata` or `generateMetadata`.
 */
export { SITE_ORIGIN, siteCanonicalUrl, canonicalMetadata } from "@/lib/seo/canonical";
