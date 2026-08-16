"use client";

import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/ui";
import type { TeacherDirectoryDetail } from "@/features/teachers/types/index";

export default function ArchiveConfirmDialog({ isOpen, teacher, isSubmitting, onClose, onConfirm }: { isOpen: boolean; teacher: TeacherDirectoryDetail; isSubmitting: boolean; onClose: () => void; onConfirm: () => void }) {
  const t = useTranslations("teachers");
  return <ConfirmDialog isOpen={isOpen} onClose={onClose} onConfirm={onConfirm} title={t("archive.title")} description={t("archive.description", { teacher: teacher.displayName.fullName })} confirmLabel={t("archive.confirm")} cancelLabel={t("actions.cancel")} loading={isSubmitting} severity="danger" />;
}
