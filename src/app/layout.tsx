import { headers } from "next/headers";
import { somar } from "@/lib/fonts";
import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Moazzez | معزز",
  description: "School Management System",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("X-NEXT-INTL-LOCALE") === "en" ? "en" : "ar";

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body className={`${somar.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
