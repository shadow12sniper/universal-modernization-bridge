import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // We no longer use webpack customisation – Turbopack handles WASM assets automatically.
  // Tell Next.js that `sql.js` is an external package (it contains WASM).
  serverExternalPackages: ["sql.js"],

  // Silence Turbopack warning by providing an empty turbopack config.
  turbopack: {},
};

export default nextConfig;