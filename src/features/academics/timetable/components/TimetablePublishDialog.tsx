"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import Modal from "@/components/ui/modal/Modal";

interface TimetablePublishDialogProps {
  open: boolean;
  loading: boolean;
  hasWarnings: boolean;
  contextName: string;
  configurationName: string;
  scopeName: string;
  classroomCount: number;
  lessonCount: number;
  onClose: () => void;
  onReview: () => void;
  onConfirm: () => void;
}

export default function TimetablePublishDialog({
  open,
  loading,
  hasWarnings,
  contextName,
  configurationName,
  scopeName,
  classroomCount,
  lessonCount,
  onClose,
  onReview,
  onConfirm,
}: TimetablePublishDialogProps) {
  const t = useTranslations("academics.timetable");
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={t("publish.confirmTitle")}
      description={t("workflow.publishDescription")}
      size="lg"
      closeOnEscape={!loading}
      closeOnOverlayClick={!loading}
      showCloseButton={!loading}
      footer={
        <div className="flex w-full flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t("publish.cancel")}
          </Button>
          <Button variant="secondary" onClick={onReview} disabled={loading}>
            {t("workflow.reviewAgain")}
          </Button>
          <Button onClick={onConfirm} loading={loading} disabled={loading}>
            {t("publish.confirm")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-600">{contextName}</p>
          <h3 className="mt-1 break-words font-semibold text-gray-950">
            {configurationName}
          </h3>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-xs text-gray-600">
                {t("overview.editingScope")}
              </dt>
              <dd className="mt-1 break-words text-sm font-medium text-primary">
                {scopeName}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-600">
                {t("workflow.classroomsInScope")}
              </dt>
              <dd className="mt-1 font-semibold text-gray-950">
                {classroomCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-600">
                {t("workflow.savedLessons")}
              </dt>
              <dd className="mt-1 font-semibold text-gray-950">
                {lessonCount}
              </dd>
            </div>
          </dl>
        </div>
        <p className="text-sm leading-6 text-gray-700">
          {t("workflow.publishImpact")}
        </p>
        {hasWarnings && (
          <p
            role="note"
            className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900"
          >
            {t("workflow.publishWarnings")}
          </p>
        )}
      </div>
    </Modal>
  );
}
