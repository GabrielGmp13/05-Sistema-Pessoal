import type { NextConfig } from "next";

// Exclusivo para homologação com Supabase local. Produção nunca libera HTTP.
const origemLocal = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_SUPABASE_URL === 'http://127.0.0.1:54321'
  ? ' http://127.0.0.1:54321' : '';

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
  "frame-src 'self' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https:${origemLocal}`,
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co${origemLocal}`,
  "media-src 'self' blob: https:",
  "worker-src 'self' blob:",
].join('; ');

const nextConfig: NextConfig = {
  serverExternalPackages: ['sql.js'],
  outputFileTracingIncludes: {
    '/api/importacao/anki': ['./node_modules/sql.js/dist/sql-wasm.wasm'],
  },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'Content-Security-Policy', value: contentSecurityPolicy },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }]
  },
};

export default nextConfig;
