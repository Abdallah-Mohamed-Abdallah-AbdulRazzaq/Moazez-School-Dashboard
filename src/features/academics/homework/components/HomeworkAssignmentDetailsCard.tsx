"use client";

import { BookOpen, GraduationCap, UserRound, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { HomeworkAssignmentUiModel } from "@/features/academics/homework/services/homeworkApi.types";

interface HomeworkAssignmentDetailsCardProps {
  homework: HomeworkAssignmentUiModel;
}

function joinDetails(values: Array<string | null | undefined>) {
  return values.filter(Boolean).join(" / ");
}

export default function HomeworkAssignmentDetailsCard({
  homework,
}: HomeworkAssignmentDetailsCardProps) {
  const t = useTranslations("academics.homework.builder.details");
  const counters = homework.counters;

  return (
    <section className="border-b border-gray-200 pb-5">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">{t("title")}</h3>
      <dl className="divide-y divide-gray-100 rounded-lg border border-gray-100 px-3">
        <Detail
          icon={<BookOpen />}
          label={t("subject")}
          value={joinDetails([homework.subjectName, homework.subjectCode])}
        />
        <Detail icon={<UserRound />} label={t("teacher")} value={homework.teacherName} />
        <Detail
          icon={<Users />}
          label={t("classroom")}
          value={joinDetails([
            homework.classroomGradeName,
            homework.classroomName,
            homework.classroomSectionName,
          ])}
        />
        <Detail
          icon={<GraduationCap />}
          label={t("academicContext")}
          value={joinDetails([homework.academicYearName, homework.termName])}
        />
      </dl>
      {counters && (
        <dl className="mt-3 grid grid-cols-3 divide-x divide-x-reverse divide-gray-200 rounded-lg bg-slate-50 px-2 py-2 text-center text-xs">
          <Metric label={t("assigned")} value={counters.assigned} />
          <Metric label={t("submitted")} value={counters.submitted} />
          <Metric label={t("reviewed")} value={counters.reviewed} />
        </dl>
      )}
    </section>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex gap-2 py-2.5">
      <span className="mt-0.5 text-primary" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-gray-500">{label}</dt>
        <dd className="mt-0.5 break-words text-sm font-medium leading-5 text-gray-900">
          {value || "-"}
        </dd>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value?: number }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="mt-1 font-semibold text-gray-900">{value ?? 0}</dd>
    </div>
  );
}
