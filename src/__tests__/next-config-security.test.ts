import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextConfig } from "next";

vi.mock("next-intl/plugin", () => ({
  default: vi.fn(() => (config: NextConfig) => config),
}));

type HeaderRule = {
  source: string;
  headers: Array<{ key: string; value: string }>;
};

async function loadHeaderMap(nodeEnv: "test" | "production" = "test") {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", nodeEnv);

  const nextConfig = (await import("../../next.config")).default;
  const rules = (await nextConfig.headers?.()) as HeaderRule[];
  const headers = rules[0]?.headers ?? [];

  return new Map(headers.map((header) => [header.key, header.value]));
}

describe("next config security headers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("includes the required baseline browser hardening headers", async () => {
    const headers = await loadHeaderMap("test");

    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Permissions-Policy")).toBe(
      "camera=(), microphone=(self), geolocation=(self)",
    );
    expect(headers.get("Content-Security-Policy")).toBe(
      [
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
      ].join("; "),
    );
  });

  it("adds HSTS only in production", async () => {
    const testHeaders = await loadHeaderMap("test");
    const productionHeaders = await loadHeaderMap("production");

    expect(testHeaders.has("Strict-Transport-Security")).toBe(false);
    expect(productionHeaders.get("Strict-Transport-Security")).toBe(
      "max-age=31536000; includeSubDomains; preload",
    );
  });
});
