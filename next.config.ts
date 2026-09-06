import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许跨域图片资源等
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
