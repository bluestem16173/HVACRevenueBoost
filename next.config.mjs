/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimization for large scale static generation
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  output: "standalone",
  async redirects() {
    return [
      // Do not add www ↔ apex redirects here: Vercel "Domains" already sends
      // apex → www (or the reverse). Duplicating the opposite rule in Next causes
      // redirect loops and "page won't load" in browsers.
      //
      // http → https on apex host only (avoids redirecting http://localhost in dev)
      {
        source: "/:path*",
        has: [
          { type: "header", key: "x-forwarded-proto", value: "http" },
          { type: "host", value: "hvacrevenueboost.com" },
        ],
        destination: "https://hvacrevenueboost.com/:path*",
        permanent: true,
      },
      { source: "/roofing", destination: "/symptom/roofing", permanent: true },
      { source: "/appliance-repair", destination: "/symptom/appliance-repair", permanent: true },
      { source: "/mold-remediation", destination: "/symptom/mold-remediation", permanent: true },
    ];
  },
  async rewrites() {
    return [
      // Sitemap index for GSC: /sitemap-index.xml lists all cluster sitemaps
      { source: "/sitemap-index.xml", destination: "/sitemap/index" },
    ];
  },
};

export default nextConfig;
