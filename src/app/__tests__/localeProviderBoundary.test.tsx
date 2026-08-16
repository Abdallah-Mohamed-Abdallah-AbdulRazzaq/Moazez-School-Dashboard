import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import RootLayout from "@/app/layout";
import LocaleLayout from "@/app/[lang]/layout";

vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers({
      "X-NEXT-INTL-LOCALE": "en",
    }),
}));

vi.mock("@/app/globals.css", () => ({}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

vi.mock("next-intl", () => ({
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="intl-provider">{children}</div>
  ),
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/app/providers", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="global-providers">{children}</div>
  ),
}));

vi.mock("@/lib/fonts", () => ({
  somar: { variable: "font-somar" },
}));

describe("locale provider boundary", () => {
  it("keeps global providers above the locale layout", async () => {
    const localeContent = await LocaleLayout({
      children: <main>Dashboard</main>,
      params: Promise.resolve({ lang: "en" }),
    });
    const document = await RootLayout({ children: localeContent });
    const markup = renderToStaticMarkup(document);

    expect(markup).toContain('lang="en"');
    expect(markup).toContain('dir="ltr"');
    expect(markup.match(/data-testid="global-providers"/g)).toHaveLength(1);
    expect(markup.match(/data-testid="intl-provider"/g)).toHaveLength(1);
    expect(markup.indexOf('data-testid="global-providers"')).toBeLessThan(
      markup.indexOf('data-testid="intl-provider"'),
    );
  });
});
