import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The chat API is called cross-origin from the WordPress site (masadvise.org).
  // CORS for that route is handled explicitly in app/api/chat/route.ts via the
  // ALLOWED_ORIGIN env var; nothing global is needed here.
  serverExternalPackages: ["pg"],
};

export default nextConfig;
