import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/", destination: "/uz", permanent: false }];
  },
};

export default nextConfig;
