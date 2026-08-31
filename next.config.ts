import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// TODO: Tighten CSP later by removing unsafe-inline and unsafe-eval after
// Next/MUI/Tailwind runtime requirements are audited.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.ggpht.com https://*.googleusercontent.com blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https: https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.googleusercontent.com http://storage.moazez.sa:9000",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https: wss: data: blob: https://*.googleapis.com https://*.gstatic.com https://*.google.com http://storage.moazez.sa:9000",
  "media-src 'self' blob:",
  "frame-src 'self' blob: https://*.google.com",
  "object-src 'self' blob:",
  "worker-src blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(self)",
  },
  {
    key: "Content-Security-Policy",
    value: csp,
  },
];

if (process.env.NODE_ENV === "production") {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  });
}

const nextConfig: NextConfig = {
  reactCompiler: {
    compilationMode: "annotation",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
        pathname: "/w40/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Existing configuration...

  async rewrites() {
    if (!apiProxyTarget) return [];

    return [
      {
        source: "/api/backend/:path*",
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, "");

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
