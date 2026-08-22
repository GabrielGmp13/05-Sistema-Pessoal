import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['sql.js'],
  outputFileTracingIncludes: {
    '/api/importacao/anki': ['./node_modules/sql.js/dist/sql-wasm.wasm'],
  },
};

export default nextConfig;
