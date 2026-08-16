import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import DocumentLocaleSync from "@/components/i18n/DocumentLocaleSync";
import { routing } from "@/i18n/routing";
import { ScopePermissionDeniedProvider } from "@/providers/ScopePermissionDeniedProvider";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!routing.locales.includes(lang as "en" | "ar")) notFound();

  const messages = (await import(`@/messages/${lang}.json`)).default;
  const locale = lang as "en" | "ar";

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <DocumentLocaleSync locale={locale} />
      <ScopePermissionDeniedProvider>{children}</ScopePermissionDeniedProvider>
    </NextIntlClientProvider>
  );
}
