import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Hides the floating Next.js logo in dev (bottom-left). Errors still show in the overlay. */
  devIndicators: false,
  /** Smaller production image when using `frontend/Dockerfile`. */
  output: "standalone",
};

export default nextConfig;
