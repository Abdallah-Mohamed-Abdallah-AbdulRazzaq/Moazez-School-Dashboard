"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";

interface TimetableMobileDayNavigationProps {
  days: { key: string; nameAr: string; nameEn: string }[];
  selectedDay: string | null;
  onDayChange: (day: string) => void;
}

export default function TimetableMobileDayNavigation({
  days,
  selectedDay,
  onDayChange,
}: TimetableMobileDayNavigationProps) {
  const dayRailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const selected = dayRailRef.current?.querySelector<HTMLElement>(
      '[aria-pressed="true"]',
    );
    if (selected?.getClientRects().length)
      selected.scrollIntoView?.({
        block: "nearest",
        inline: "nearest",
        behavior: "auto",
      });
  }, [selectedDay]);
  const t = useTranslations("academics.timetable.navigation");
  const locale = useLocale();
  const dayIndex = days.findIndex((day) => day.key === selectedDay);
  const PreviousIcon = locale === "ar" ? ArrowRight : ArrowLeft;
  const NextIcon = locale === "ar" ? ArrowLeft : ArrowRight;
  return (
    <nav
      aria-label={t("days")}
      className="sticky top-0 z-20 flex items-center gap-1 border-b border-gray-200 bg-white py-2 lg:hidden print:hidden"
    >
      <Button
        variant="secondary"
        className="min-h-11 min-w-11 shrink-0 px-2"
        aria-label={t("previousDay")}
        disabled={dayIndex <= 0}
        onClick={() => onDayChange(days[dayIndex - 1].key)}
      >
        <PreviousIcon className="h-4 w-4" aria-hidden="true" />
      </Button>
      <div
        className="flex min-w-0 flex-1 gap-1 overflow-x-auto"
        ref={dayRailRef}
        role="group"
        aria-label={t("days")}
      >
        {days.map((day) => (
          <Button
            key={day.key}
            variant={day.key === selectedDay ? "primary" : "ghost"}
            className="min-h-11 shrink-0"
            aria-pressed={day.key === selectedDay}
            onClick={() => onDayChange(day.key)}
          >
            {locale === "ar" ? day.nameAr : day.nameEn}
          </Button>
        ))}
      </div>
      <Button
        variant="secondary"
        className="min-h-11 min-w-11 shrink-0 px-2"
        aria-label={t("nextDay")}
        disabled={dayIndex >= days.length - 1}
        onClick={() => onDayChange(days[dayIndex + 1].key)}
      >
        <NextIcon className="h-4 w-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}
