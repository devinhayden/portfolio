import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // In development, serve images as they are. The dev optimiser resizes
    // on demand, one at a time, and DialKit's page snapshots request every
    // image at full size, which can back it up until nothing loads.
    // Production builds still optimise.
    unoptimized: process.env.NODE_ENV === "development",
  },
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
