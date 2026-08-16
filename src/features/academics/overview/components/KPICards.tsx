"use client";

import { useTranslations } from "next-intl";
import { Layers, BookOpen, Users, Calendar, FileText, Grid, DoorOpen, PlaySquare } from "lucide-react";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import type { AcademicsOverviewResponse } from "../services/overviewApiAdapter";

interface KPICardsProps {
  response: AcademicsOverviewResponse;
  isLoading?: boolean;
}

export default function KPICards({ response, isLoading }: KPICardsProps) {
  const t = useTranslations("academics.overview.kpi");

  if (isLoading) {
    return (
      <div className="flex min-h-[160px] items-center justify-center">
        <PartialLoader />
      </div>
    );
  }

  const { structure, subjects, rooms, teacherAllocation, curriculum, lessonPlans, timetable, calendar } = response;

  const cards = [
    {
      icon: Layers,
      iconColor: "#2563eb",
      iconBgColor: "#dbeafe",
      title: t("structure.title"),
      value: structure.gradesCount,
      subtitle: t("structure.subtitle", { grades: structure.gradesCount, sections: structure.sectionsCount, classrooms: structure.classroomsCount }),
    },
    {
      icon: BookOpen,
      iconColor: "#16a34a",
      iconBgColor: "#dcfce7",
      title: t("subjects.title"),
      value: subjects.activeSubjectsCount,
      subtitle: t("subjects.subtitle", { active: subjects.activeSubjectsCount, total: subjects.subjectsCount }),
    },
    {
      icon: DoorOpen,
      iconColor: "#f59e0b",
      iconBgColor: "#fef3c7",
      title: t("rooms.title"),
      value: rooms.roomsCount,
      subtitle: t("rooms.subtitle", { total: rooms.roomsCount }),
    },
    {
      icon: Users,
      iconColor: "#9333ea",
      iconBgColor: "#f3e8ff",
      title: t("teacherAllocation.title"),
      value: teacherAllocation.allocatedTeachersCount,
      subtitle: t("teacherAllocation.subtitle", { teachers: teacherAllocation.allocatedTeachersCount, subjects: teacherAllocation.allocatedSubjectsCount }),
    },
    {
      icon: PlaySquare,
      iconColor: "#0ea5e9",
      iconBgColor: "#e0f2fe",
      title: t("curriculum.title"),
      value: curriculum.activeCurriculaCount,
      subtitle: t("curriculum.subtitle", { units: curriculum.unitsCount, lessons: curriculum.lessonsCount }),
    },
    {
      icon: FileText,
      iconColor: "#8b5cf6",
      iconBgColor: "#ede9fe",
      title: t("lessonPlans.title"),
      value: lessonPlans.lessonPlansCount,
      subtitle: t("lessonPlans.subtitle", { plannedItems: lessonPlans.plannedItemsCount }),
    },
    {
      icon: Grid,
      iconColor: "#6366f1",
      iconBgColor: "#e0e7ff",
      title: t("timetable.title"),
      value: timetable.activeEntriesCount,
      subtitle: t("timetable.subtitle", { active: timetable.activeEntriesCount, total: timetable.entriesCount }),
    },
    {
      icon: Calendar,
      iconColor: "#ec4899",
      iconBgColor: "#fce7f3",
      title: t("calendar.title"),
      value: calendar.upcomingEventsCount,
      subtitle: t("calendar.subtitle", { upcoming: calendar.upcomingEventsCount, total: calendar.eventsCount }),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <KPICardV2
          key={index}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          icon={card.icon}
          iconColor={card.iconColor}
          iconBgColor={card.iconBgColor}
          showChart={false}
          className="h-full"
        />
      ))}
    </div>
  );
}
