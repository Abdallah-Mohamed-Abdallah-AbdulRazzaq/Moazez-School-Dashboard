"use client";

import { useTranslations } from "next-intl";
import TeacherCredentialIndicator from "./TeacherCredentialIndicator";
import TeacherProfileCompleteness from "./TeacherProfileCompleteness";
import TeacherStatusBadge from "./TeacherStatusBadge";
import type { TeacherDirectoryDetail } from "@/features/teachers/types/index";

export default function TeacherDetailHeader({
  teacher,
}: {
  teacher: TeacherDirectoryDetail;
}) {
  const t = useTranslations("teachers");
  const statusLabel = (status: string) => t(`statuses.${status.toLowerCase()}`);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{teacher.displayName.fullName}</h1>
          <p className="mt-1 text-sm text-gray-500">{teacher.teacherCode ?? t("details.no_value")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TeacherStatusBadge status={teacher.employmentStatus} label={statusLabel(teacher.employmentStatus)} />
          <TeacherStatusBadge status={teacher.accountStatus} label={statusLabel(teacher.accountStatus)} />
          <TeacherStatusBadge status={teacher.membershipStatus} label={statusLabel(teacher.membershipStatus)} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-5 border-t border-gray-100 pt-4">
        <TeacherCredentialIndicator credential={teacher.credentialSummary} label={t(`credentials.${teacher.credentialSummary.status}`)} />
        <TeacherProfileCompleteness completeness={teacher.profileCompleteness} completeLabel={t("completeness.complete")} incompleteLabel={t("completeness.incomplete")} />
      </div>
    </div>
  );
}
