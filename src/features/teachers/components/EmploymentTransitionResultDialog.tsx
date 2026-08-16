"use client";

import { useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";
import type { TeacherEmploymentStatusResponse } from "@/features/teachers/types/index";

export default function EmploymentTransitionResultDialog({ response, onClose }: { response: TeacherEmploymentStatusResponse | null; onClose: () => void }) {
  const t = useTranslations("teachers");
  if (!response) return null;

  return (
    <Modal isOpen onClose={onClose} title={t("lifecycle.result_title")} size="sm" footer={<Button onClick={onClose}>{t("actions.close")}</Button>}>
      <dl className="space-y-3 text-sm">
        <div><dt className="text-gray-500">{t("lifecycle.revoked_sessions")}</dt><dd className="font-semibold">{response.transition.revokedSessionCount}</dd></div>
        <div><dt className="text-gray-500">{t("lifecycle.current_allocations")}</dt><dd className="font-semibold">{response.transition.allocationSummary.currentActiveCount}</dd></div>
        {response.transition.reassignmentRequired ? <p className="rounded-lg bg-amber-50 p-3 text-amber-800">{t("lifecycle.reassignment_required")}</p> : null}
      </dl>
    </Modal>
  );
}
