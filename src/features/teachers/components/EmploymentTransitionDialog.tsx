"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, DateTimePicker, Modal } from "@/components/ui";
import { activationBlockers } from "@/features/teachers/utils/employmentTransitions";
import type {
  ChangeTeacherEmploymentStatusRequest,
  TeacherDirectoryListItem,
  TeacherDirectoryDetail,
  TeacherEmploymentStatus,
} from "@/features/teachers/types/index";

interface EmploymentTransitionDialogProps {
  isOpen: boolean;
  teacher: TeacherDirectoryDetail | TeacherDirectoryListItem;
  targetStatus: TeacherEmploymentStatus;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: ChangeTeacherEmploymentStatusRequest) => Promise<void>;
}

export default function EmploymentTransitionDialog(props: EmploymentTransitionDialogProps) {
  const t = useTranslations("teachers");
  const [effectiveAt, setEffectiveAt] = useState<Date | null>(null);
  const blockers = props.targetStatus === "ACTIVE" && "workingDays" in props.teacher ? activationBlockers(props.teacher) : [];
  const submit = () => props.onSubmit({
    employmentStatus: props.targetStatus,
    ...(effectiveAt ? { effectiveAt: effectiveAt.toISOString() } : {}),
  });

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} title={t(`lifecycle.titles.${props.targetStatus.toLowerCase()}`)} size="sm" footer={<><Button variant="secondary" onClick={props.onClose}>{t("actions.cancel")}</Button><Button variant={props.targetStatus === "TERMINATED" ? "danger" : "primary"} disabled={Boolean(blockers.length)} loading={props.isSubmitting} onClick={() => void submit()}>{t("actions.confirm")}</Button></>}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{t(`lifecycle.confirmations.${props.targetStatus.toLowerCase()}`)}</p>
        {blockers.length ? <ul className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{blockers.map((blocker) => <li key={blocker}>{t(`lifecycle.blockers.${blocker}`)}</li>)}</ul> : null}
        <DateTimePicker label={t("lifecycle.effective_at")} value={effectiveAt} onChange={setEffectiveAt} maxDateTime={new Date()} />
      </div>
    </Modal>
  );
}
