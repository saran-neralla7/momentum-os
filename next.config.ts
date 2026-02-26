import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  customWorkerSrc: "worker",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Mapbox removed
};

export default withPWA(nextConfig);
