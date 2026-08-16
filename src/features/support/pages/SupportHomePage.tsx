"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { BookOpen, MessageCircle } from "lucide-react";
import SupportPermissionGuard from "../components/SupportPermissionGuard";

const copy = {
  en: {
    title: "How can we help?",
    subtitle:
      "Find product guidance in the help center or start a live support chat with Moazez.",
    helpCenter: "Open Help Center",
    liveChat: "Live Chat Support",
  },
  ar: {
    title: "كيف يمكننا مساعدتك؟",
    subtitle:
      "اطلع على إرشادات المنتج في مركز المساعدة أو ابدأ محادثة مباشرة مع دعم معزز.",
    helpCenter: "فتح مركز المساعدة",
    liveChat: "الدعم بالمحادثة المباشرة",
  },
} as const;

export default function SupportHomePage() {
  return (
    <SupportPermissionGuard permission="school.support.view">
      <SupportHomeContent />
    </SupportPermissionGuard>
  );
}

function SupportHomeContent() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const labels = isArabic ? copy.ar : copy.en;
  const helpCenterUrl = `https://moazez.sa/${locale}/help-center`;

  return (
    <main className="min-h-[calc(100dvh-96px)] flex justify-center items-center bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
            {labels.title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            {labels.subtitle}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href={helpCenterUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <BookOpen className="h-5 w-5" />
            <span>{labels.helpCenter}</span>
          </a>

          <Link
            href={`/${locale}/help/chat`}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <MessageCircle className="h-5 w-5 text-primary" />
            <span>{labels.liveChat}</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
