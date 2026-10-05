"use client";

import type { ReactNode } from "react";
import { FileType2, FolderOpen, Send, UsersRound } from "lucide-react";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { TeacherPreparationTargetDisplay } from "../../model/teacherPreparationDetail";
import type {
  AcademicContentAsset,
  AcademicContentDetail,
} from "../../types/contracts";

type SubjectResourceContent = Extract<
  AcademicContentDetail,
  { type: "SUBJECT_RESOURCE" }
>;

function MetadataCell({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-e border-gray-200 px-4 py-3 last:border-e-0">
      <span className="text-primary">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="truncate text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function SubjectResourceMetadataStrip({
  content,
  selectedAsset,
  targets,
}: {
  content: SubjectResourceContent;
  selectedAsset: AcademicContentAsset | null;
  targets: readonly TeacherPreparationTargetDisplay[];
}) {
  const t = useAcademicContentTranslations("subject_resource_detail");
  const commonT = useAcademicContentTranslations();
  const target =
    targets
      .map(({ subject, scope }) => [subject, scope].filter(Boolean).join(" · "))
      .filter(Boolean)
      .join(", ") || t("context.no_targets");
  return (
    <section className="grid overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-4">
      <MetadataCell
        icon={<FolderOpen aria-hidden="true" className="size-5" />}
        label={t("metadata.category")}
        value={commonT(
          `resource_categories.${content.details?.resourceCategory ?? "OTHER"}`,
        )}
      />
      <MetadataCell
        icon={<UsersRound aria-hidden="true" className="size-5" />}
        label={t("metadata.target")}
        value={target}
      />
      <MetadataCell
        icon={<FileType2 aria-hidden="true" className="size-5" />}
        label={t("metadata.file_type")}
        value={selectedAsset?.mimeType ?? t("context.not_set")}
      />
      <MetadataCell
        icon={<Send aria-hidden="true" className="size-5" />}
        label={t("metadata.status")}
        value={
          content.publicationStatus
            ? commonT(`publication.statuses.${content.publicationStatus}`)
            : commonT(`statuses.${content.status}`)
        }
      />
    </section>
  );
}
