import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The default bottom-left position covers the footer's own text in dev,
  // which reads as a rendering fault rather than a dev tool.
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
