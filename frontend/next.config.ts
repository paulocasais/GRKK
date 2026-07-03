import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: (process.env.NODE_ENV === "production" && !process.env.VERCEL) ? "export" : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
