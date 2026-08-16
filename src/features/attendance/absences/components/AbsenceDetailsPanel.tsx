"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { X, FileText, Edit2, Calendar, User, GraduationCap, Clock3 } from "lucide-react";
import Button from "@/components/ui/button/Button";
import FilePreviewModal from "@/components/ui/file-preview-modal";
import { formatAttendanceDateTime } from "@/features/attendance/utils/dateFormatting";
import { formatFileSize } from "@/utils/upload/validateFile";
import type { AttachmentMeta } from "@/features/attendance/roll-call/types";
import type { StructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import type { AbsenceRecord } from "../types";
import { getLocalizedStructureName } from "../utils/localizedStructureName";
import { canCorrectIncidentToEarlyLeave } from "../utils/correctionPermissions";

interface AbsenceDetailsPanelProps {
  record: AbsenceRecord | null;
  onClose: () => void;
  onEditExcuse: (record: AbsenceRecord) => void;
  onEditEarlyLeave: (record: AbsenceRecord) => void;
  isReadOnly: boolean;
  structureTree: StructureTree | null;
  onAttachmentPreviewChange?: (open: boolean) => void;
}

export default function AbsenceDetailsPanel({
  record,
  onClose,
  onEditExcuse,
  onEditEarlyLeave,
  isReadOnly,
  structureTree,
  onAttachmentPreviewChange,
}: AbsenceDetailsPanelProps) {
  const t = useTranslations("attendance.absences.details");
  const tTable = useTranslations("attendance.absences.table");
  const locale = useLocale();
  const router = useRouter();
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentMeta | null>(null);
  const openAttachmentPreview = (attachment: AttachmentMeta) => {
    setPreviewAttachment(attachment);
    onAttachmentPreviewChange?.(true);
  };
  const closeAttachmentPreview = () => {
    setPreviewAttachment(null);
    onAttachmentPreviewChange?.(false);
  };

  if (!record) {
    return (
      <div
        className="h-full flex items-center justify-center p-6"
        style={{ backgroundColor: "var(--card-background)" }}
      >
        <p style={{ color: "var(--color-neutral-500)" }} className="text-sm">{t("selectRecord")}</p>
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    const statusKeys: Record<string, "absent" | "late" | "earlyLeave" | "excused" | "unmarked"> = {
      ABSENT: "absent",
      LATE: "late",
      EARLY_LEAVE: "earlyLeave",
      EXCUSED: "excused",
      UNMARKED: "unmarked",
    };
    return tTable(`statusLabels.${statusKeys[status] || "unmarked"}`);
  };

  const handleOpenStudentProfile = () => {
    router.push(`/${locale}/students-guardians/students/${record.studentId}`);
  };

  return (
    <>
      <div
        className="h-full flex flex-col"
        style={{ backgroundColor: "var(--card-background)" }}
      >
        <div
          className="flex items-center justify-between p-4 border-b shrink-0"
          style={{ borderColor: "var(--border-color)" }}
        >
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            {t("title")}
          </h3>
          <button
            onClick={onClose}
            style={{ color: "var(--color-neutral-400)" }}
            className="transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User style={{ color: "var(--color-neutral-400)" }} className="w-4 h-4" />
                <h4 style={{ color: "var(--color-gray-700)" }} className="text-sm font-semibold">{t("studentInfo")}</h4>
              </div>
              <div className="space-y-2 pl-6">
                <div>
                  <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("studentName")}:</span>
                  <button
                    type="button"
                    onClick={handleOpenStudentProfile}
                    className="block text-sm font-medium text-start underline underline-offset-2"
                    style={{ color: "var(--color-primary-700)" }}
                    title={t("openStudentProfile")}
                  >
                    {locale === "ar" ? record.studentNameAr : record.studentNameEn}
                  </button>
                  <p style={{ color: "var(--color-neutral-500)" }} className="text-xs">
                    {locale === "ar" ? record.studentNameEn : record.studentNameAr}
                  </p>
                </div>
                <div>
                  <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("studentNumber")}:</span>
                  <p style={{ color: "var(--color-gray-900)" }} className="text-sm">{record.studentNumber || "—"}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap style={{ color: "var(--color-neutral-400)" }} className="w-4 h-4" />
                <h4 style={{ color: "var(--color-gray-700)" }} className="text-sm font-semibold">{t("gradeSection")}</h4>
              </div>
              <div className="space-y-2 pl-6">
                <div>
                  <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("grade")}:</span>
                  <p style={{ color: "var(--color-gray-900)" }} className="text-sm">
                    {getLocalizedStructureName(record, structureTree, "grade", locale)}
                  </p>
                </div>
                <div>
                  <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("section")}:</span>
                  <p style={{ color: "var(--color-gray-900)" }} className="text-sm">
                    {getLocalizedStructureName(record, structureTree, "section", locale)}
                  </p>
                </div>
                <div>
                  <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("classroom")}:</span>
                  <p style={{ color: "var(--color-gray-900)" }} className="text-sm">
                    {getLocalizedStructureName(record, structureTree, "classroom", locale)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar style={{ color: "var(--color-neutral-400)" }} className="w-4 h-4" />
                <h4 style={{ color: "var(--color-gray-700)" }} className="text-sm font-semibold">{t("incidentDetails")}</h4>
              </div>
              <div className="space-y-2 pl-6">
                <div>
                  <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("date")}:</span>
                  <p style={{ color: "var(--color-gray-900)" }} className="text-sm">{record.date}</p>
                </div>
                <div>
                  <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("type")}:</span>
                  <p style={{ color: "var(--color-gray-900)" }} className="text-sm">
                    {record.granularity === "DAILY_DERIVED"
                      ? locale === "ar"
                        ? "يومي (مشتق)"
                        : "Daily (Derived)"
                      : record.granularity === "DAILY"
                        ? locale === "ar"
                          ? "يومي"
                          : "Daily"
                      : locale === "ar"
                        ? "حصة"
                        : "Period"}
                  </p>
                </div>
                {record.granularity === "PERIOD" && (
                  <div>
                    <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("period")}:</span>
                    <p style={{ color: "var(--color-gray-900)" }} className="text-sm">
                      {(locale === "ar" ? record.periodNameAr : record.periodNameEn) ||
                        record.periodNameEn || record.periodNameAr ||
                        (record.periodIndex ? `P${record.periodIndex}` : record.periodKey || "-")}
                    </p>
                  </div>
                )}
                <div>
                  <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("status")}:</span>
                  <p style={{ color: "var(--color-gray-900)" }} className="text-sm font-medium">{getStatusLabel(record.status)}</p>
                </div>
                {record.minutesLate ? (
                  <div>
                    <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("minutesLate")}:</span>
                    <p style={{ color: "var(--color-gray-900)" }} className="text-sm">{record.minutesLate}</p>
                  </div>
                ) : null}
                {record.minutesEarlyLeave ? (
                  <div>
                    <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("minutesEarlyLeave")}:</span>
                    <p style={{ color: "var(--color-gray-900)" }} className="text-sm">{record.minutesEarlyLeave}</p>
                  </div>
                ) : null}
              </div>
            </div>

            {record.excuse && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText style={{ color: "var(--color-neutral-400)" }} className="w-4 h-4" />
                  <h4 style={{ color: "var(--color-gray-700)" }} className="text-sm font-semibold">{t("excuse")}</h4>
                </div>
                <div className="space-y-2 pl-6">
                  <div>
                    <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("reason")}:</span>
                    <p style={{ color: "var(--color-gray-900)" }} className="text-sm">
                      {locale === "ar" ? record.excuse.reasonAr || record.excuse.reasonEn : record.excuse.reasonEn || record.excuse.reasonAr}
                    </p>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("excuseCreatedAt")}:</span>
                    <p style={{ color: "var(--color-gray-900)" }} className="text-sm">{formatAttendanceDateTime(record.excuse.createdAt, locale)}</p>
                  </div>
                  {record.excuse.attachments && record.excuse.attachments.length > 0 && (
                    <div>
                      <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("attachments")}:</span>
                      <div className="mt-2 space-y-2">
                        {record.excuse.attachments.map((att) => (
                          <button
                            key={att.id}
                            type="button"
                            onClick={() => openAttachmentPreview(att)}
                            className="w-full text-start p-3 rounded border"
                            style={{ borderColor: "var(--border-color)", backgroundColor: "var(--background)" }}
                            title={t("previewAttachment")}
                          >
                            <div style={{ color: "var(--color-gray-900)" }} className="text-sm font-medium truncate">
                              {att.name}
                            </div>
                            <div style={{ color: "var(--color-neutral-500)" }} className="text-xs mt-1">
                              {formatFileSize(att.size)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock3 style={{ color: "var(--color-neutral-400)" }} className="w-4 h-4" />
                <h4 style={{ color: "var(--color-gray-700)" }} className="text-sm font-semibold">{t("timeline")}</h4>
              </div>
              <div className="space-y-2 pl-6">
                <div>
                  <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("updatedAt")}:</span>
                  <p style={{ color: "var(--color-gray-900)" }} className="text-sm">{formatAttendanceDateTime(record.updatedAt, locale)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {record.granularity !== "DAILY_DERIVED" && !isReadOnly && record.sessionStatus === "SUBMITTED" && (
          <div
            className="flex items-center gap-3 p-4 border-t shrink-0"
            style={{ borderColor: "var(--border-color)" }}
          >
            {record.status !== "EXCUSED" && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<FileText className="w-4 h-4" />}
                onClick={() => onEditExcuse(record)}
                className="flex-1"
              >
                {record.excuse ? t("editExcuse") : t("addExcuse")}
              </Button>
            )}
            {canCorrectIncidentToEarlyLeave(record.status) && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Edit2 className="w-4 h-4" />}
                onClick={() => onEditEarlyLeave(record)}
                className="flex-1"
              >
                {t("editMinutes")}
              </Button>
            )}
          </div>
        )}
      </div>

      <FilePreviewModal
        attachment={previewAttachment}
        isOpen={!!previewAttachment}
        onClose={closeAttachmentPreview}
      />
    </>
  );
}
