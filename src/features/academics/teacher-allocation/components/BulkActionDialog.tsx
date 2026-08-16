"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Users, X, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import Button from "@/components/ui/button/Button";
import {
  Classroom,
  Grade,
  Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  Subject,
} from "@/features/academics/subjects/services/subjectsService";
import {
  Teacher,
  applyTeacherToGrade,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { teacherAllocationUiError } from "@/features/academics/teacher-allocation/services/teacherAllocationErrors";
import TeacherAllocationTechnicalDetails from "./TeacherAllocationTechnicalDetails";

interface BulkActionDialogProps {
  open: boolean;
  onClose: () => void;
  termId: string;
  grade: Grade | null;
  subject: Subject | null;
  teacher: Teacher | null;
  sections: Section[];
  classrooms: Classroom[];
  onSuccess: () => void | Promise<void>;
}

export default function BulkActionDialog({
  open,
  onClose,
  termId,
  grade,
  subject,
  teacher,
  sections,
  classrooms,
  onSuccess,
}: BulkActionDialogProps) {
  const t = useTranslations("academics.teacherAllocation.bulkAction");
  const locale = useLocale();

  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<{
    message: string;
    traceId?: string;
    details: string[];
  } | null>(null);
  const [applySummary, setApplySummary] = useState<{
    requestedClassrooms: number;
    createdCount: number;
    existingCount: number;
  } | null>(null);

  useEffect(() => {
    if (open) {
      void Promise.resolve().then(() => {
        setApplyError(null);
        setApplySummary(null);
      });
    }
  }, [open]);

  const affectedClassrooms = grade
    ? classrooms.filter((classroom) =>
        sections.some(
          (section) =>
            section.id === classroom.sectionId &&
            section.gradeId === grade.id,
        ),
      )
    : [];
  const affectedClassroomIds = affectedClassrooms.map((classroom) => classroom.id);
  const affectedCount = affectedClassrooms.length;

  const getGradeName = () => {
    if (!grade) return "";
    return locale === "ar"
      ? (grade.nameAr || grade.nameEn)
      : (grade.nameEn || grade.nameAr);
  };

  const getSubjectName = () => {
    if (!subject) return "";
    return locale === "ar"
      ? (subject.nameAr || subject.nameEn)
      : (subject.nameEn || subject.nameAr);
  };

  const getTeacherName = () => {
    if (!teacher) return "";
    return locale === "ar"
      ? (teacher.nameAr || teacher.nameEn)
      : (teacher.nameEn || teacher.nameAr);
  };

  const handleApply = async () => {
    if (!grade || !subject || !teacher) return;

    const confirmed = window.confirm(
      t("confirmMessage", {
        teacher: getTeacherName(),
        subject: getSubjectName(),
        count: affectedCount,
      }),
    );
    if (!confirmed) return;

    setIsApplying(true);
    setApplyError(null);
    setApplySummary(null);
    try {
      const response = await applyTeacherToGrade({
        termId,
        gradeId: grade.id,
        subjectId: subject.id,
        teacherUserId: teacher.id,
        classroomIds: affectedClassroomIds,
      });

      setApplySummary(response.summary);
      await onSuccess();
    } catch (error) {
      console.error("Failed to apply teacher:", error);
      setApplyError(
        teacherAllocationUiError(error, "Failed to apply teacher to grade."),
      );
    } finally {
      setIsApplying(false);
    }
  };

  const handleClose = () => {
    if (!isApplying) {
      onClose();
    }
  };

  if (!grade || !subject || !teacher) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Users className="w-5 h-5 text-primary" />
        <span className="flex-1 font-semibold">{t("title")}</span>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          disabled={isApplying}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <X className="w-5 h-5" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <div className="space-y-6">
          <div>
            <p className="text-gray-700 mb-4">
              {t("message", {
                teacher: getTeacherName(),
                subject: getSubjectName(),
                grade: getGradeName(),
              })}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
            <div className="flex items-start gap-3">
              <div className="text-gray-500 text-sm font-medium min-w-[80px]">
                {t("labels.teacher")}:
              </div>
              <div className="flex-1 text-gray-900 font-medium">
                {getTeacherName()}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-gray-500 text-sm font-medium min-w-[80px]">
                {t("labels.subject")}:
              </div>
              <div className="flex-1 text-gray-900">
                {getSubjectName()}
                {subject.code && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                    {subject.code}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-gray-500 text-sm font-medium min-w-[80px]">
                {t("labels.grade")}:
              </div>
              <div className="flex-1 text-gray-900">
                {getGradeName()}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-gray-500 text-sm font-medium min-w-[80px]">
                {t("labels.classrooms")}:
              </div>
              <div className="flex-1 text-gray-900 font-semibold">
                {affectedCount}
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 mb-1">
                  {t("impact", { count: affectedCount })}
                </p>
                <p className="text-sm text-amber-700">
                  {t("replaceWarning")}
                </p>
              </div>
            </div>
          </div>

          {affectedClassrooms.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                {t("affectedClassrooms")}:
              </h4>
              <div className="flex flex-wrap gap-2">
                {affectedClassrooms.map((classroom) => (
                  <span
                    key={classroom.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    {locale === "ar"
                      ? (classroom.nameAr || classroom.nameEn || classroom.name)
                      : (classroom.nameEn || classroom.nameAr || classroom.name)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {applyError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div>{applyError.message}</div>
              <TeacherAllocationTechnicalDetails
                traceId={applyError.traceId}
                details={applyError.details}
              />
            </div>
          )}

          {applySummary && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <div className="font-semibold">{t("summary.title")}</div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <SummaryMetric label={t("summary.classrooms")} value={applySummary.requestedClassrooms} />
                <SummaryMetric label={t("summary.created")} value={applySummary.createdCount} />
                <SummaryMetric label={t("summary.existing")} value={applySummary.existingCount} />
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50">
        <Button
          onClick={handleClose}
          variant="secondary"
          disabled={isApplying}
        >
          {t("cancel")}
        </Button>
        <Button
          onClick={handleApply}
          variant="primary"
          leftIcon={<Users className="w-4 h-4" />}
          disabled={isApplying || affectedCount === 0 || Boolean(applySummary)}
        >
          {isApplying ? t("applying") : t("confirm")}
        </Button>
      </div>
    </Dialog>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-white/80 px-3 py-2 text-center">
      <div className="text-xs text-green-700">{label}</div>
      <div className="mt-1 text-lg font-semibold text-green-900">{value}</div>
    </div>
  );
}
