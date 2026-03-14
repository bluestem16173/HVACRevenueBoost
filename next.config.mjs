/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimization for large scale static generation
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      // Sitemap index for GSC: /sitemap-index.xml lists all cluster sitemaps
      { source: "/sitemap-index.xml", destination: "/sitemap/index" },
    ];
  },
};

export default nextConfig;
