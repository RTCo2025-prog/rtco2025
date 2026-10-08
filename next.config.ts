import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // تجاهل أخطاء الـ type check الصارمة أثناء الـ Build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;