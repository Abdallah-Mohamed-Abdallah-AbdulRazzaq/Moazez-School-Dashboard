"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Layers, BookOpen, Grid, Calendar, Clock, Users, FileText, DoorOpen } from "lucide-react";

interface QuickLinksProps {
  lang: string;
}

export default function QuickLinks({ lang }: QuickLinksProps) {
  const t = useTranslations("academics.overview.quickLinks");

  const links = [
    {
      href: `/${lang}/academics/structure`,
      icon: Layers,
      titleKey: "structure",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      href: `/${lang}/academics/subjects`,
      icon: BookOpen,
      titleKey: "subjects",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      href: `/${lang}/academics/rooms`,
      icon: DoorOpen,
      titleKey: "rooms",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      href: `/${lang}/academics/curriculum`,
      icon: Grid,
      titleKey: "curriculum",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      href: `/${lang}/academics/calendar`,
      icon: Calendar,
      titleKey: "calendar",
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600",
    },
    {
      href: `/${lang}/academics/timetable`,
      icon: Clock,
      titleKey: "timetable",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      href: `/${lang}/academics/lesson-plans`,
      icon: FileText,
      titleKey: "lessonPlans",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      href: `/${lang}/academics/teacher-allocation`,
      icon: Users,
      titleKey: "teacherAllocation",
      iconBg: "bg-cyan-100",
      iconColor: "text-cyan-600",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("title")}</h2>
      
      {/* Desktop/Tablet: Grid */}
      <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all"
            >
              <div className={`w-12 h-12 rounded-full ${link.iconBg} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${link.iconColor}`} />
              </div>
              <span className="text-sm font-medium text-gray-700 text-center">{t(link.titleKey)}</span>
            </Link>
          );
        })}
      </div>

      {/* Mobile: Horizontal Scroll */}
      <div className="sm:hidden overflow-x-auto -mx-6 px-6">
        <div className="flex gap-3 pb-2" style={{ minWidth: 'min-content' }}>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all flex-shrink-0"
                style={{ width: '120px' }}
              >
                <div className={`w-12 h-12 rounded-full ${link.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${link.iconColor}`} />
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">{t(link.titleKey)}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
