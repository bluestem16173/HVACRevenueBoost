/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimization for large scale static generation
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
