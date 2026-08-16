"use client";

import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/utils/formatters/dateTime";
import type { HeroJourneyBadge, HeroJourneyStudentProgress } from "../types";
import HeroJourneyBadgeThumb from "./HeroJourneyBadgeThumb";
import HeroJourneyStatusPill from "./HeroJourneyStatusPill";

interface HeroJourneyStudentDetailContentProps {
  student: HeroJourneyStudentProgress | null;
  badgeMap: Map<string, HeroJourneyBadge>;
}

export default function HeroJourneyStudentDetailContent({
  student,
  badgeMap,
}: HeroJourneyStudentDetailContentProps) {
  const locale = useLocale();
  const t = useTranslations("heroJourney");

  if (!student) {
    return <div className="text-sm text-gray-500">{t("empty.students")}</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {student.studentName}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {locale === "ar"
            ? `${student.gradeNameAr} - ${student.sectionNameAr}`
            : `${student.gradeNameEn} - ${student.sectionNameEn}`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-gray-500">{t("detail.currentLevel")}</p>
          <p className="mt-1 font-semibold text-gray-900">{student.currentLevel}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-gray-500">{t("detail.completedMissions")}</p>
          <p className="mt-1 font-semibold text-gray-900">
            {student.completedMissionsCount}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-500">
            {t("detail.currentMission")}
          </p>
          <HeroJourneyStatusPill
            kind="progress"
            value={student.progressStatus}
          />
        </div>
        <p className="text-sm font-semibold text-gray-900">
          {locale === "ar"
            ? student.currentMissionTitleAr
            : student.currentMissionTitleEn}
        </p>
        <p className="mt-2 text-sm text-gray-600">
          {student.xpCurrent}/{student.xpTarget} XP
        </p>
      </div>

      <div className="rounded-lg border border-gray-100 p-4">
        <p className="text-sm font-medium text-gray-500">
          {t("detail.currentObjectives")}
        </p>
        <div className="mt-3 space-y-2">
          {student.currentObjectives.map((objective) => (
            <div
              key={objective.id}
              className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm"
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                  objective.isCompleted
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {objective.isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <span className="text-gray-700">
                {locale === "ar" ? objective.titleAr : objective.titleEn}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 p-4">
        <p className="text-sm font-medium text-gray-500">
          {t("detail.recentBadges")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {student.recentBadgeSlugs.length > 0 ? (
            student.recentBadgeSlugs.map((slug) => (
              <HeroJourneyBadgeThumb
                key={slug}
                badge={badgeMap.get(slug)}
                showLabel
              />
            ))
          ) : (
            <p className="text-sm text-gray-500">{t("empty.badges")}</p>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm font-medium text-gray-500">{t("detail.coachNote")}</p>
        <p className="mt-2 text-sm text-gray-700">
          {locale === "ar" ? student.coachNoteAr : student.coachNoteEn}
        </p>
        <p className="mt-3 text-xs text-gray-500">
          {t("detail.lastActivityLabel", {
            date: formatDate(student.lastActivityAt, locale),
          })}
        </p>
      </div>
    </div>
  );
}
